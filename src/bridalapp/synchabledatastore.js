define(['suid', 'bridalapp/class', 'bridalapp/datastore'], function (Suid, Class, DataStore) {
	'use strict';
	
	/**
	 * 'Abstract' base class for local datastores that can synched with some backend.
	 * 
	 * <p>The main API of synchable datastores is:</p>
	 * 
	 * <dl>
	 *   <dt><code>Boolean <b>lookSynched</b>()</code></dt>
	 *   <dd>Indicates whether the datastore looks synched (from this end).</dd>
	 *   <dt><code>Promise <b>synch</b>()</code></dt>
	 *   <dd>Brings this datastore back into synch.</dd>
	 *   <dt><code>Boolean <b>isSynching</b>()</code></dt>
	 *   <dd>Indicates whether this datastore is currently busy synching.</dd>
	 *   <dt><code>Array(-like) <b>items</b>()</code></dt>
	 *   <dd>Returns an 'immutable' array(-like) that represents a live view of the items 
	 *       maintained in this store.</dd>
	 *   <dt><code>Array <b>createdItems</b>()</code></dt>
	 *   <dd>'Immutable' array of items that have been added to the store since the last synch.</dd>
	 *   <dt><code>Array <b>updatedItems</b>()</code></dt>
	 *   <dd>'Immutable' array of items that have been updated since the last synch.</dd>
	 *   <dt><code>Array <b>deletedItems</b>()</code></dt>
	 *   <dd>'Immutable' array of items that have been deleted from the store since the last synch.</dd>
	 *   <dt><code>Array <b>staleItems</b>()</code></dt>
	 *   <dd>'Immutable' array of items that could not be saved during the last synch because they went stale.</dd>
	 *   <dt><code>Array <b>failedItems</b>()</code></dt>
	 *   <dd>'Immutable' array of items that could not be saved during the last synch because they had errors.</dd>
	 *   <dt><code>Array <b>futureItems</b>()</code></dt>
	 *   <dd>'Immutable' array of items that were already updated when a synch started and were then updated again while synch was in progress.</dd>
	 * </dl>
	 * 
	 * <p>synchable datastores are assumed to have fast access to (a cache of) all data they maintain.
	 * As such they provide a synchronous API for accessing and mutating the data in the datastore 
	 * that is easier to work with than the default asynchronous <code>load</code>, <code>count</code>, 
	 * <code>save</code> and <code>delete</code> methods:</p>
	 * 
	 * <dl>
	 *   <dt><code>Array get(criteria, pageSize, pageIndex)</code></dt>
	 *   <dd>Synchronous equivalent of <code>load</code>.</dd>
	 *   <dt><code>Number len(criteria)</code></dt>
	 *   <dd>Synchronous equivalent of <code>count</code>.</dd>
	 *   <dt><code>Array set(item)</code></dt>
	 *   <dd>Synchronous equivalent of <code>save</code>.</dd>
	 *   <dt><code>Array del(item)</code></dt>
	 *   <dd>Synchronous equivalent of <code>delete</code>.</dd>
	 * </dl>
	 * 
	 * <p>The synchronous methods operate on the locally cached data. As such, the
	 * methods <code>set</code> and <code>del</code> will usually make the datastore
	 * <i>out of synch</i>. You can check whether the datastore still looks in synch
	 * with <code>looksSynched</code> and bring it back in synch with <code>synch</code>.</p>
	 * 
	 * <p>Unlike their asynchonous counterparts, the synchronous methods <code>set</code>
	 * and <code>del</code> return the items unchanged, so essentially they can be
	 * discarded.</p>
	 */
	var SynchableDataStore = Class('SynchableDataStore', DataStore, {
		
		initialize: function SynchableDataStore_initialize($super, name, url, cfg) {
			$super(name, url, cfg);
		},
		
		/** 
		 * Synchronous equivalent of <code>load</code>.
		 * 
		 * <p>No remote request will actually be fired. The filtering based on the
		 * given <code>criteria</code> and the paging both happen client-side and
		 * will be fast as long as the dataset is not too large.</p>
		 */
		get: function SynchableDataStore_get(criteria, pageSize, pageIndex, clone) {
			var items = clone ? Persistent.clone(this.items()) : this.items();
			return Persistent.page(Persistent.matches(items, criteria), pageSize, pageIndex);
		},

		/** 
		 * Synchronous equivalent of <code>count</code>.
		 *  
		 * <p>No remote request will actually be fired. This method just calls
		 * <code>get</code> with the given <code>criteria</code> and returns
		 * the number of results it got.</p>
		 */
		len: function SynchableDataStore_len(criteria) {
			return this.get(criteria).length;
		},
		
		/**
		 * Indicates whether this datastore looks synchronized (from this end). 
		 * 
		 * <p>This method will return <code>false</code> if there are any outstanding changes, 
		 * but this method returning <code>true</code> does not guarantee anything as it is 
		 * impossible to determine whether something was changed on the remote side without
		 * actually making a request.
		 */
		looksSynched: function SynchableDataStore_looksSynched() {
			// if lastSynched == Date(0) (epoch) it means we are not synched
			// if there are any items in any of the lists it means we are not in synch
			return (this.lastSynched().getTime() !== 0) && 
					(! (this.createdItems().length || this.updatedItems().length || this.deletedItems().length));
		},
		

//		ABSTRACT-------------------------------------------------------------------------
//		             'abstract' methods each synchable datastore should have
//		---------------------------------------------------------------------------------
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
		synch: function SynchableDataStore_synch() {return new Promise(function(resolve){resolve();})},

		/** Indicates whether this datastore is currently busy synching. */
		isSynching: function SynchableDataStore_isSynching() {return false;},
		
		/** Gets or sets the (device) date time this datastore was last synched. */
		lastSynched: function SynchableDataStore_lastSynched(newDate) {return newDate || new Date();},
		
		/**
		 * Returns an 'immutable' array that represents a live view of the items
		 * maintained in this store. 
		 * 
		 * <p>The result of this method can be used for observing/monitoring the
		 * data set. DO NOT MUTATE THIS ARRAY!.</p>
		 */
		items: function SynchableDataStore_items() {},
		
		/** 'Immutable' array of items that have been added to the store since the last synch. */
		createdItems: function SynchableDataStore_createdItems() {return [];},
		
		/** 'Immutable' array of the original versions of items that have been updated since the last synch. */
		updatedItems: function SynchableDataStore_updatedItems() {return [];},
		
		/** 'Immutable' array of items that have been deleted since the last synch. */
		deletedItems: function SynchableDataStore_deletedItems() {return [];},
		
		/** 'Immutable' array of items that could not be saved during the last synch because they went stale. */
		staleItems: function SynchableDataStore_staleItems() {return [];},
		
		/** 'Immutable' array of items that could not be saved during the last synch because they had errors. */
		failedItems: function SynchableDataStore_failedItems() {return [];},
		
		/** 
		 * 'Immutable' array of items that were already updated when a synch started and were then updated again while synch was in progress.
		 *  These items are effectively stale, but because the user edited his own items, we can safely assume
		 *  he wishes to overwrite the remote version with the item that is in this list.
		 */
		futureItems: function SynchableDataStore_failedItems() {return [];},

		/** 
		 * Synchronous equivalent of <code>save</code>.
		 * 
		 * <p>The arrays returned by <code>updatedItems</code>, <code>createdItems</code>
		 * and <code>removedItems</code> will be updated to reflect the changes made
		 * to the datastore since the last synch.</p>
		 */
		set: function SynchableDataStore_set(item) {return item},
		
		/**
		 * Synchronous equivalent of <code>delete</code>.
		 *  
		 * <p>The arrays returned by <code>updatedItems</code>, <code>createdItems</code>
		 * and <code>removedItems</code> will be updated to reflect the changes made
		 * to the datastore since the last synch.</p>
		 */
		del: function SynchableDataStore_del(item) {return item},
//		/ABSTRACT------------------------------------------------------------------------
		
		toString: function SynchableDataStore_toString($super) {
			var s = $super();
			s = s.substring(0, s.length - 2);
			return '[Object ' + this.constructor.classname + ' \'' + this.name + '\' {' + 
					'url: \'' + this.url + '\', ' + 
					'lastSynched:' + this.lastSynched() + ', ' + 
					'items:' + this.items().length + ', ' + 
					'created:' + this.createdItems().length + ', ' + 
					'updated:' + this.updatedItems().length + ', ' + 
					'deleted:' + this.deletedItems().length + ', ' + 
					'stale:' + this.staleItems().length + ', ' +
					'failed:' + this.failedItems().length + '}]';
		}
	});
	
	
	return SynchableDataStore;
});
