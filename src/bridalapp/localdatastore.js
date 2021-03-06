define(['bridalapp/class',
		'bridalapp/log',
		'bridalapp/datastore', 
		'bridalapp/synchabledatastore', 
		'bridalapp/persistent',
		'memorystorage'], 
function (Class, log, DataStore, SynchableDataStore, Persistent, MemoryStorage) {
	'use strict';
	
	var LocalDataStore = Class('LocalDataStore', SynchableDataStore, {

		initialize: function LocalDataStore_initialize($super, name, url, cfg) {
			log().log('Initializing LocalDataStore `' + name + '`...');
			$super(name, url, cfg);
			if (!this.cfg.local || !this.cfg.store) { 
				var repoIdx = url.indexOf('://') + 3,
					storeIdx = url.lastIndexOf('/'),
					repo = url.substring(repoIdx, storeIdx),
					store = url.substring(storeIdx + 1);
				if (!this.cfg.repo) {this.cfg.repo = repo;}
				if (!this.cfg.store) {this.cfg.store = store;}
			}
			log().log('Initialized LocalDataStore `' + name + '`.');
		},
		
		/**
		 * Loads all items from this store matching the given <code>criteria</code>.
		 * 
		 * <p>This method returns a <code>Promise</code> that resolves to an array(-like) that should be
		 * treated as immutable. To mutate the store, use <code>save</code> and <code>delete</code>.</p>
		 * 
		 * @param criteria Criteria to match on. Optional. Object.
		 * @param pageSize Limits the number of results to fetch. Optional. Number.
		 * @param pageIndex Indicates which results to fetch. Optional. Only applies when 
		 *        <code>pageSize &gt; 0</code>. Number. 
		 * 
		 * @return A <code>Promise<code> that resolves to an 'immutable' array of items, 
		 *         possibly empty but never <code>null</code> or <code>undefined</code>.
		 */
		load: function LocalDataStore_load(criteria, pageSize, pageIndex) {
			log().log('Loading LocalDataStore `' + name + '`...');
			var store = this;
			return new Promise(function(resolve){
				resolve(store.get(criteria, pageSize, pageIndex));
				log().log('Loaded LocalDataStore `' + name + '`.');
			});
		},
		
		/**
		 * Counts the items matching the given <code>criteria</code>.
		 * 
		 * <p>This method returns a <code>Promise</code> that resolves to the number of items that match
		 * the given <code>criteria</code>, or to the total number of items if no <code>criteria</code> 
		 * were given. Using this number (which will be typically obtained with an efficient operation
		 * such as <code>SELECT COUNT(..)</code>) you can calculate the number of pages for a certain
		 * <code>pageSize</code> and thus determine the valid range for the <code>pageIndex</code>
		 * parameter of the <code>load</code> operation.</p>
		 * 
		 * @param criteria Criteria to match on. Optional. Object.
		 * 
		 * @return A <code>Promise<code> that resolves to an 'immutable' array of items, 
		 *         possibly empty but never <code>null</code> or <code>undefined</code>.
		 */
		count: function LocalDataStore_count(criteria) {
			log().log('LocalDataStore `' + name + '` count() starting (criteria=' + criteria + ')...');
			var store = this;
			return new Promise(function(resolve){
				resolve(store.len());
				log().log('LocalDataStore `' + name + '` count() done: ' + store.len() + '.');
			});
		},
		
		/**
		 * Saves the given <code>item</code>(s).
		 * 
		 * <p>Returns a <code>Promise</code> that resolves to an 'immutable' array(-like) with the added 
		 * or changed items. These items may have changes compared with the given items (such as last 
		 * modified date, version etc) so the originals are stale after this method completes.</p> 
		 * 
		 * <p>The argument can be an instance of <code>Persistent</code> or an array(-like) of instances 
		 * of <code>Persistent.</code>. Multiple arguments can be given. These are all ways to save 
		 * three persistent objects <code>a</code>, <code>b</code> and <code>c</code> (though they
		 * differ in performance, bundling calls is quicker)</p>:
		 * 
		 * <code><pre>
		 * myDataStore.save(a);
		 * myDataStore.save(b);
		 * myDataStore.save(c);
		 * // or
		 * myDataStore.save(a, b, c);
		 * // or
		 * myDataStore.save([a,b,c]);
		 * // or
		 * myDataStore.save(a, [b,c]);
		 * // etc...
		 * </pre></code>
		 * 
		 * <p>If we need to wait for the result of the operation, we can do so like this:</p>
		 * 
		 * <code><pre>
		 * myDataStore.save(myItems).then(function(results){
		 *    // Hooray! The items are saved!
		 *    for (var i=0, item; item=results[i]; i++) { 
		 *       // do something kick-ass with this item
		 *       alert('Yeah! ' + item + ' is saved!'); 
		 *    }
		 * }).catch(function(e){
		 *    // Oh no!! Something went wrong!
		 *    alert('There was an error: ' + e);
		 * });
		 * </pre></code>
		 * 
		 * 
		 * @param  item Either a single persistent item or an array(-like) of persistent items. 
		 * @return A <code>Promise</code> that resolves to an 'immutable' array of items that were added 
		 *         or changed. Possibly empty but never <code>null</code> or <code>undefined</code>.
		 */
		save: function LocalDataStore_save(item) {
			log().log('LocalDataStore `' + name + '` save() starting (item=' + item + ')...');
			var store = this;
			return new Promise(function(resolve){
				resolve(store.set(item));
				log().log('LocalDataStore `' + name + '` save() done.');
			});
		},

		/**
		 * Permanently deletes the given <code>item</code>s.
		 * 
		 * <p>Returns a <code>Promise</code> that yields the removed items in an array(-like). 
		 * The returned array(-like) should be treated as immutable.</p>
		 * 
		 * <p>The argument can be an instance of Persistent or an array(-like) of instances of Persistent. 
		 * Just like with <code>save()</code>, multiple arguments can be given.</p>
		 * 
		 * @param  item Either a single persistent item or an array(-like) of persistent items. 
		 * @return An 'immutable' array of items that were removed. Possibly empty but never <code>null</code>.
		 */
		delete: function LocalDataStore_delete(item) {
			log().log('LocalDataStore `' + name + '` delete() starting (item=' + item + ')...');
			var store = this;
			return new Promise(function(resolve){
				resolve(store.del(item));
				log().log('LocalDataStore `' + name + '` delete() done.');
			});
		},
		
		set: function LocalDataStore_set(item) {
			log().log('LocalDataStore `' + name + '` set() starting (item=' + item + ')...');
			var results = Persistent.eachArg(arguments, this, function(item) {
				var backup = null,
					idx = Persistent.indexOf(this.db().items, item);
				if (idx === -1) {this.db().items.push(item);} 
				else {backup = this.db().items.splice(idx, 1, item)[0];}
				
				// item had been deleted previously?
				idx = Persistent.indexOf(this.db().deleted, item);
				if (idx !== -1) {
					// item was deleted, then added again, so effectively it was updated.
					backup = this.db().deleted.splice(idx, 1);
				}
				if (backup) {
					idx = Persistent.indexOf(this.db().updated, item);
					if (idx === -1) {this.db().updated.push(backup);}
					else if (this.synching) {
						// the synch is already in progress... meaning when we get back the saved
						// item our new version would appear stale... So put it in future list
						idx = Persistent.indexOf(this.db().future, item);
						if (idx === -1) {this.db().future.push(item);}
						else {this.db().future.splice(idx, 1, item);}
					}
				}
				return [item];
			});
			log().log('LocalDataStore `' + name + '` set(): triggering change event.');
			this.trigger('change');
			log().log('LocalDataStore `' + name + '` set(): done.');
			return results;
		},

		del: function LocalDataStore_del(item) {
			log().log('LocalDataStore `' + name + '` del() starting (item=' + item + ')...');
			var results = Persistent.eachArg(arguments, this, function(item) {
				var backup, idx = Persistent.indexOf(this.items(), item);
				if (idx !== -1) {backup = this.items().splice(idx, 1)[0];}
				if (Persistent.persistent(item)) {
					// if item was in updated list, remove it
					idx = Persistent.indexOf(this.db().updated, item);
					if (idx !== -1) {
						var removed = this.db().updated.splice(idx, 1);
						backup = backup || removed;
					}
					// if item was in future list, remove it
					idx = Persistent.indexOf(this.db().future, item);
					if (idx !== -1) {this.db().future.splice(idx, 1);}
					// if item was not in deleted list, add it (old version if we have it)
					idx = Persistent.indexOf(this.db().deleted, item);
					if (idx === -1) {this.db().deleted.push(backup || item);}
				}
				return [backup || item];
			});
			log().log('LocalDataStore `' + name + '` del(): triggering change event.');
			this.trigger('change');
			log().log('LocalDataStore `' + name + '` del(): done.');
			return results;
		},
		
		/** Gets or sets the (device) date time this store was last synched. */
		lastSynched: function LocalDataStore_lastSynched(date) {
			if (date) {this.db().lastSynched = date;}
			return this.db().lastSynched;
		},

		/**
		 * Returns an 'immutable' array that represents a live view of the items
		 * maintained in this store. 
		 * 
		 * <p>The result of this method can be used for observing/monitoring the
		 * data set. DO NOT MUTATE THIS ARRAY!.</p>
		 */
		items: function LocalDataStore_items() {
			return this.db().items;
		},

		/** List of created items is calculated dynamically based on which items are not persistent yet */
		createdItems: function LocalDataStore_createdItems() {
			var results = [];
			for (var i=0, item; item=this.items()[i]; i++) {
				if (! Persistent.persistent(item)) {results.push(item);}
			}
			return results;
		},
		
		updatedItems: function LocalDataStore_updatedItems() {
			return this.db().updated;
		},
		
		deletedItems: function LocalDataStore_deletedItems() {
			return this.db().deleted;
		},

		staleItems: function LocalDataStore_staleItems() {
			return this.db().stale;
		},
		
		failedItems: function LocalDataStore_failedItems() {
			return this.db().failed;
		},
		
		futureItems: function LocalDataStore_futureItems() {
			return this.db().future;
		},
		
		db: function LocalDataStore_db() {
			if (! this.cfg.local) {
				this.cfg.local = new MemoryStorage(this.cfg.repo);
				if (! this.cfg.local[this.cfg.store]) {this.cfg.local[this.cfg.store] = {};}
				for (var i=0,key; key=['items', 'updated', 'deleted', 'stale', 'failed', 'future'][i]; i++) {
					if (! this.db()[key]) {this.db()[key] = [];}
				}
				if(! this.db().lastSynched) {this.db().lastSynched = new Date(0);}
			}
			return this.cfg.local[this.cfg.store];
		}
	});
	
	DataStore.registerType('local', function LocalDataStoreFactory(name, url, cfg) {
		return new LocalDataStore(name, url, cfg);
	});
	
	return LocalDataStore;
});
