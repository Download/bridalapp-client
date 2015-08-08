define(['bridalapp/class', 
		'jquery', 
		'bridalapp/log', 
		'bridalapp/persistent', 
		'bridalapp/datastore', 
		'bridalapp/synchabledatastore', 
		'bridalapp/synchrequest', 
		'bridalapp/synchresponse'], 

function (Class, $, log, Persistent, DataStore, SynchableDataStore, SynchRequest, SynchResponse) {
	'use strict';

	var SynchedDataStore = Class('SynchedDataStore', SynchableDataStore, {
		
		initialize: function SynchedDataStore_initialize($super, name, url, cfg) {
			$super(name, url, cfg);
			this.synching = false;
			this.synchError = false;
			cfg = this.cfg;
			if (cfg.autoSynch === undefined) {cfg.autoSynch = true;}
			if (!cfg.synchInterval) {cfg.synchInterval = 30 * 1000;}    // 30 sec.
			if (!cfg.pollInterval) {cfg.pollInterval = 60 * 60 * 1000;} // 60 min.
			if (cfg.remoteSynch === undefined) {cfg.remoteSynch = true;}
			if ((! cfg.localDataStore) || (! cfg.remoteDataStore)) {
				// url: 'synched://rhaboo/bridal-app/ratings#http/api/ratings'
				var urls = url.split('://')[1].split('#');
				if (! cfg.localDataStore) {
					var localParts=urls[0].split('/'), 
						localType=localParts[0],
						localRepo=localParts.slice(1, localParts.length-1).join('/'),
						localStore=localParts[localParts.length-1];
					cfg.localDataStore = DataStore.fromType(name, localType, 
							localType + '://' + localRepo + '/' + localStore);
					if (! (cfg.localDataStore instanceof SynchableDataStore)) {
						if (cfg.localDataStore) {
							log().error('Unable to initialize SynchedDataStore \'' + name + '\'.' + 
									'Need a synchable datastore for the local side, ' + 
									'but ' + cfg.localDataStore + ' is not a SynchableDataStore.');
						}
						else {
							log().error('Unable to initialize SynchedDataStore \'' + name + '\'.' + 
									'Need a synchable datastore for the local side, but ' + 
									'could not find a datastore for url \'' + urls[0] + '\'.');
						}
					}
				}
				if (! cfg.remoteDataStore) {
					var remoteParts=urls[1].split('/'),
						remoteType=remoteParts[0],
						remoteRepo=remoteParts.slice(1, remoteParts.length-1).join('/'),
						remoteStore=remoteParts[remoteParts.length-1];
					cfg.remoteDataStore = DataStore.fromType(name, remoteType, '/' + remoteRepo + '/' + remoteStore);
					if (! cfg.remoteDataStore) {
						log().error('Unable to initialize SynchedDataStore \'' + name + '\'.' + 
								'Need a datastore for the remote side, but ' + 
								'could not find a datastore for url \'' + urls[1] + '\'.');
					}
				}
			}
		},

		/** 
		 * Brings this datastore back into synch.
		 * 
		 * <p>Returns a promise that resolves on synch complete or rejects on
		 * synch failure. The arrays returned by <code>staleItems</code> and 
		 * <code>failedItems</code> will be updated with items that could not
		 * be saved because they had been changed on the remote server in the
		 * meantime, or that gave (integrity constraint) validation errors,
		 * respectively.</p> 
		 */
		synch: function SynchedDataStore_synch($super, force) {
			if (this.cfg.autoSynch) {autoSynch(this);}
			var me = this, cfg = me.cfg;
			if ((!force) && me.synching) {return me.synching;}
			me.synchError = false;
			if (! cfg.remoteDataStore.cfg.supportsSynch) {return poorMansSynch(me);}
			return me.synching = new Promise(function(resolve, reject) {
				// if not forced synch and store looks synched and poll interval not expired, do nothing.
				if ((!force) && me.looksSynched() && (Date.now() < me.lastSynched().getTime() + cfg.pollInterval)) {
					// postpone resolving until after synch method has returned.
					return setTimeout(function(){
						me.synching = false;
						resolve();
					},0);
				}
				
				// synching is needed
				me.trigger('synch:started');
				var changed = false;
				var req = new SynchRequest();
				req.criteria = cfg.filter || null;
				req.createdItems.push.apply(req.createdItems, me.createdItems());
				req.updatedItems.push.apply(req.updatedItems, me.updatedItems());
				req.deletedItems.push.apply(req.deletedItems, me.deletedItems());
				req.currentIds.push.apply(req.currentIds, Persistent.pluck(me.items(), 'id'));
				req.currentVersions.push.apply(req.currentVersions, Persistent.pluck(me.items(), 'version'));

				cfg.remoteDataStore.synch(req).then(function(response) {
					var i,id,idx,item;

					// handle deleted items
					if (response.deletedIds.length) {
						for (i=0; id=response.deletedIds[i]; i++) {
							idx = Persistent.indexOf(me.items(), id);
							if (idx !== -1) {
								me.items().splice(idx, 1);
								changed = true;
							}
							idx = Persistent.indexOf(me.deletedItems(), id);
							if (idx !== -1) {me.deletedItems().splice(idx, 1);}
						}
						log().log('Processed ' + response.deletedIds.length + ' deleted items.');
					}

					// handle updated items
					if (response.updatedItems.length) {
						for (i=0; item=response.updatedItems[i]; i++) {
							// if we have futureItems, try to merge the changes into the new version of the item
							idx = Persistent.indexOf(me.futureItems(), item)
							if (idx !== -1) {
								// get future item and remove from list
								var future = me.futureItems().splice(idx, 1)[0];
								// replace updated item with version from server
								idx = Persistent.indexOf(me.updatedItems(), item);
								if (idx !== -1) {me.updatedItems().splice(idx, 1, item);}
								else {me.updatedItems().push(item);}
								// now merge changes from future item onto server item
								var merged = Persistent.clone(item);
								for (var key in future) {
									if (key !== 'version') {
										merged[key] = future[key]; 
									}
								}
								// replace item with the merged version
								idx = Persistent.indexOf(me.items(), item);
								if (idx !== -1) {
									me.items().splice(idx, 1, merged);
								}
							}
							else {
								// remove saved item from the updatedItems list
								idx = Persistent.indexOf(me.updatedItems(), item);
								if (idx !== -1) {me.updatedItems().splice(idx, 1);}
								else {changed = true;}
								// replace item with the saved version
								idx = Persistent.indexOf(me.items(), item);
								if (idx !== -1) {me.items().splice(idx, 1, item);}
								else {me.items().push(item);}
							}
						}
						log().log('Processed ' + response.updatedItems.length + ' updated items.');
					}

					// handle created items
					if (response.createdItems.length) {
						for (i=0; item=response.createdItems[i]; i++) {
							idx = Persistent.indexOf(me.items(), item);
							if (idx === -1) {
								me.items().push(item);
								changed = true;
							}
							else {me.items().splice(idx, 1, item);}
						}
						log().log('Processed ' + response.createdItems.length + ' created items.');
					}

					// handle stale items
					if (response.staleItems.length) {
						for (i=0; item=response.staleItems[i]; i++) {
							idx = Persistent.indexOf(me.staleItems(), item);
							if (idx === -1) {me.staleItems().push(item);}
							else {me.staleItems().splice(idx, 1, item);}
							idx = Persistent.indexOf(me.createdItems(), item);
							if (idx !== -1) {me.createdItems().splice(idx, 1);}
							idx = Persistent.indexOf(me.updatedItems(), item);
							if (idx !== -1) {me.updatedItems().splice(idx, 1);}
							idx = Persistent.indexOf(me.deletedItems(), item);
							if (idx !== -1) {me.deletedItems().splice(idx, 1);}
						}
						log().log('Processed ' + response.staleItems.length + ' stale items.');
					}

					if (response.failedItems.length) {
						// handle failed items
						for (i=0; item=response.failedItems[i]; i++) {
							idx = Persistent.indexOf(me.failedItems(), item);
							if (idx === -1) {me.failedItems().push(item);}
							else {me.failedItems().splice(idx, 1, item);}
							if (Persistent.indexOf(me.createdItems(), item) !== -1) {
								// created items is a virtual array, remove from items
								idx = Persistent.indexOf(me.items(), item);
								if (idx !== -1) {me.items().splice(idx, 1);}
							}
							idx = Persistent.indexOf(me.updatedItems(), item);
							if (idx !== -1) {me.updatedItems().splice(idx, 1);}
							idx = Persistent.indexOf(me.deletedItems(), item);
							if (idx !== -1) {me.deletedItems().splice(idx, 1);}
						}
						log().log('Processed ' + response.failedItems.length + ' failed items.');
					}

					me.lastSynched(new Date());
					me.synching = false;
					if (changed) {me.trigger('change');} 
					me.trigger('synch:success');
					resolve();
					me.trigger('synch:done');
				}).catch(function(e){
					me.synching = false;
					me.synchError = e;
					me.trigger('synch:failed');
					reject(e);
					me.trigger('synch:done');
				});
			});
		},
		
		/** Indicates whether this datastore is currently busy synching. */
		isSynching: function SynchedDataStore_isSynching() {
			return !!this.synching;
		},

		// IMPLEMENT ALL ABSTRACT METHODS.
		// ASYNCH methods will call synch to try to make sure after the call the results
		// are consistent for both the local as well as the remote datastore.
		load: function SynchedDataStore_load(criteria, pageSize, pageIndex) {
			var me = this;
			return new Promise(function(resolve, reject){
				this.synch().then(function(){
					me.cfg.localDataStore.load(criteria, pageSize, pageIndex).then(function(items){
						resolve(items);
					});
				}).catch(function(e){
					reject(e);
				});
			}); 
		},

		count: function SynchedDataStore_count(criteria) {
			var me = this;
			return new Promise(function(resolve, reject){
				this.synch().then(function(){
					me.cfg.localDataStore.count(criteria, pageSize, pageIndex).then(function(count){
						resolve(count);
					}).catch(function(e){
						reject(e);
					});
				}).catch(function(e){
					reject(e);
				});
			}); 
		},

		save: function SynchedDataStore_save(item) {
			var me = this;
			return new Promise(function(resolve, reject){
				me.cfg.localDataStore.save(item).then(function(items){
					me.synch().then(function(){
						resolve(items);
					}).catch(function(e){
						reject(e);
					});
				}).catch(function(e){
					reject(e);
				});
			}); 
		},

		delete: function SynchedDataStore_delete(item) {
			var me = this;
			return new Promise(function(resolve, reject){
				me.cfg.localDataStore.delete(item).then(function(items){
					me.synch().then(function(){
						resolve(items);
					}).catch(function(e){
						reject(e);
					});
				}).catch(function(e){
					reject(e);
				});
			}); 
		},
		
		// synchronous methods will interact with the local datastore only (remote does not support synchronous invocation)
		/** Gets or sets the (local/device) date time this datastore was last synched. */
		lastSynched: function SynchedDataStore_lastSynched(newDate) {
			return this.cfg.localDataStore.lastSynched(newDate);
		},
		
		/**
		 * Returns an 'immutable' array that represents a live view of the items
		 * maintained in this store. 
		 * 
		 * <p>The result of this method can be used for observing/monitoring the
		 * data set. DO NOT MUTATE THIS ARRAY!.</p>
		 */
		items: function SynchedDataStore_items() {
			return this.cfg.localDataStore.items();
		},
		
		/** 'Immutable' array of items that have been added to the store since the last synch. */
		createdItems: function SynchedDataStore_createdItems() {
			return this.cfg.localDataStore.createdItems();
		},
		
		/** 'Immutable' array of the original versions of items that have been updated since the last synch. */
		updatedItems: function SynchedDataStore_updatedItems() {
			return this.cfg.localDataStore.updatedItems();
		},
		
		/** 'Immutable' array of items that have been deleted since the last synch. */
		deletedItems: function SynchedDataStore_deletedItems() {
			return this.cfg.localDataStore.deletedItems();
		},
		
		/** 'Immutable' array of items that could not be saved during the last synch because they went stale. */
		staleItems: function SynchedDataStore_staleItems() {
			return this.cfg.localDataStore.staleItems();
		},
		
		/** 'Immutable' array of items that could not be saved during the last synch because they had errors. */
		failedItems: function SynchedDataStore_failedItems() {
			return this.cfg.localDataStore.failedItems();
		},
		
		/** 
		 * 'Immutable' array of items that were already updated when a synch started and were then updated again while synch was in progress.
		 *  These items are effectively stale, but because the user edited his own items, we can safely assume
		 *  he wishes to overwrite the remote version with the item that is in this list.
		 */
		futureItems: function SynchedDataStore_futureItems() {
			return this.cfg.localDataStore.futureItems();
		},
		
		/** 
		 * Synchronous equivalent of <code>save</code>.
		 * 
		 * <p>The arrays returned by <code>updatedItems</code>, <code>createdItems</code>
		 * and <code>removedItems</code> will be updated to reflect the changes made
		 * to the datastore since the last synch.</p>
		 */
		set: function SynchedDataStore_set(item) {
			return this.cfg.localDataStore.set(item);
		},
		
		/**
		 * Synchronous equivalent of <code>delete</code>.
		 *  
		 * <p>The arrays returned by <code>updatedItems</code>, <code>createdItems</code>
		 * and <code>removedItems</code> will be updated to reflect the changes made
		 * to the datastore since the last synch.</p>
		 */
		del: function SynchedDataStore_del(item) {
			return this.cfg.localDataStore.del(item);
		}
	});

	DataStore.registerType('synched', function SynchedDataStoreFactory(name, url, cfg) {
		return new SynchedDataStore(name, url, cfg);
	});
	
	function handleLoadedItems(me, items) {
		var item, old, idx, changed=false;
		// all items we got from the remote should be added if we did not have them on local,
		// or updated locally if the version we got from the remote was different. only the 
		// remote updates the version, so it being different means our version is older.
		for (var i=0; item=items[i]; i++) {
			idx = Persistent.indexOf(me.items(), item); 
			if (idx === -1) {
				// item is not in local. either it's new on remote, or was deleted on local
				idx = Persistent.indexOf(me.deletedItems(), item);
				if (idx !== -1) {
					// item was deleted on local. check version
					if (item.version !== me.deletedItems()[idx].version) {
						// item was deleted locally, but edited on server, so our deleted
						// version becomes stale, but as we deleted it we don't care and
						// don't add it to stale. We just remove it from deletedItems.
						me.deletedItems().splice(idx, 1);
						// add the new version of the item we had deleted
						me.items().push(item);
					}
				}
				else {
					// item is new on remote
					me.items().push(item);
				}
				changed = true;
			}
			else {
				// item is already in local. check version
				if (item.version !== me.items()[idx].version) {
					// local version is older than remote version. replace
					old = me.items().splice(idx, 1, item)[0]; 
					// if we had updated this item, the update went stale
					idx = Persistent.indexOf(me.updatedItems(), old); 
					if (idx !== -1){
						// changed item was updated, so went stale
						me.updatedItems().splice(idx, 1);
						idx = Persistent.indexOf(me.staleItems(), old); 
						if (idx === -1) {me.staleItems().push(old);}
						else {me.staleItems().splice(idx, 1, old);}
					}
					changed = true;
				}
			}
		}

		// all items we did NOT get from the remote should be removed locally, 
		// except for newly created ones
		for (var i=me.items().length-1; i>=0; i--) {
			item = me.items()[i];
			if ((Persistent.indexOf(items, item) === -1) &&
				(Persistent.indexOf(me.createdItems(), item) === -1)){ 
				// item is not new, but does not exist (any more) on the remote
				var old = me.items().splice(i, 1)[0];
				idx = Persistent.indexOf(me.updatedItems(), old);
				if (idx !== -1) { 
					// removed item was updated locally, so went stale
					this.updatedItems().splice(idx, 1);
					idx = Persistent.indexOf(me.staleItems(), old); 
					if (staleIdx === -1) {me.staleItems().push(old);}
					else {me.staleItems().splice(idx, 1, old);}
				}
				changed = true;
			}
		}
		if (changed) {me.trigger('change');}
	}

	function handleSavedItems(me, items) {
		for (var i=0,item; item=items[i]; i++) {
			// if we have futureItems, try to merge the changes into the new version of the item
			var idx = Persistent.indexOf(me.futureItems(), item)
			if (idx !== -1) {
				var future = me.futureItems().splice(idx, 1)[0];
				// replace updatedItems with version from server
				idx = Persistent.indexOf(me.updatedItems(), item);
				if (idx !== -1) {me.updatedItems().splice(idx, 1, item);}
				else {me.updatedItems().push(item);}
				// now merge changes from future item onto server item
				var merged = Persistent.clone(item);
				for (var key in future) {
					if (key !== 'version') {
						merged[key] = future[key]; 
					}
				}
				// replace items with the merged version
				idx = Persistent.indexOf(me.items(), item);
				if (idx !== -1) {me.items().splice(idx, 1, merged);}
			}
			else {
				// remove saved item from the updatedItems list
				idx = Persistent.indexOf(me.updatedItems(), item);
				if (idx !== -1) {me.updatedItems().splice(idx, 1);}
				// replace items with the saved version
				idx = Persistent.indexOf(me.items(), item);
				if (idx !== -1) {me.items().splice(idx, 1, item);}
			}
		}
	}

	function handleDeletedItems(me, items) {
		for (var i=0,item; item=items[i]; i++) {
			var idx = Persistent.indexOf(me.deletedItems(), item);
			if (idx !== -1) {me.deletedItems().splice(idx, 1);}
		}
	}
	
	function poorMansSynch(me) {
		var cfg = me.cfg;
		return me.synching = new Promise(function(resolve, reject) {
			// if store looks synched and poll interval not expired, do nothing.
			if (me.looksSynched() && (Date.now() < me.lastSynched().getTime() + cfg.pollInterval)) {
				// postpone resolving until after synch method has returned.
				return setTimeout(function(){
					me.synching = false;
					resolve();
				},0);
			}
			// synching is needed
			me.trigger('synch:started');
			cfg.remoteDataStore.load().then(function(items) {
				// handle loaded items, save dirty items and delete removed items
				handleLoadedItems(me, items);
				// now that we processed all loaded items we can save our changes.
				// Make a snapshot of current state: dirty and deleted items.
				var dirty = me.createdItems().concat();
				for (var i=0,item; item=me.updatedItems()[i]; i++) {
					// The items in updated are the old versions, so get the corresponding new version
					var idx = Persistent.indexOf(me.items(), item);
					if (idx !== -1) {dirty.push(me.items()[idx]);}
				}
				var deleted = me.deletedItems().concat();
				// delete items first
				new Promise(function(resolve, reject){
					if (! deleted.length) {resolve(); return;}
					cfg.remoteDataStore.delete(deleted).then(function(items){
						handleDeletedItems(me, items);
						resolve();
					}).catch(function(e){
						reject(e);
					});
				}).then(function(){
					// items are deleted, now we can create new, or update
					new Promise(function(resolve, reject){
						if (! dirty.length) {resolve(); return;}
						cfg.remoteDataStore.save(dirty).then(function(items){
							handleSavedItems(me, items);
							resolve();
						}).catch(function(e){
							reject(e);
						});
					}).then(function(){
						me.lastSynched(new Date());
						me.synching = false;
						me.synchError = false;
						me.trigger('synch:success');
						resolve();
						me.trigger('synch:done');
					}).catch(function(e){
						reject(e);
					});
				}).catch(function(e){
					reject(e);
				});
			}).catch(function(e) {
				// load failed
				me.synching = false;
				me.synchError = e;
				me.trigger('synch:failed');
				reject(e);
				me.trigger('synch:done');
			});
		});
	}

	function autoSynch(me) {
		if (! me.autoSynchActive) {
			me.autoSynchActive = true;
			setInterval(function(){
				me.synch();
			}, me.cfg.synchInterval);
		}
	}

	return SynchedDataStore;
});
