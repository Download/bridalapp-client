define(['bridalapp/class'], function (Class) {
	'use strict';
	
	/**
	 * 'Abstract' base class for datastores.
	 * 
	 * <p>Interaction with the datastore happens through four methods:</p>
	 * <dl>
	 *   <dt><code>Promise <b>load</b>(criteria, pageSize, pageIndex)</code></dt>
	 *   <dd>Loads items from the store that match the given <code>criteria</code> (if any), 
	 *       paging the results if so desired.</dd>
	 *   <dt><code>Promise <b>count</b>(criteria)</code></dt>
	 *   <dd>Counts the items that match the given <code>criteria</code> (if any). This count
	 *       can be used to calculate the <code>pageIndex</code> parameters when using paging.</dd>
	 *   <dt><code>Promise <b>save</b>(items)</code></dt>
	 *   <dd>Adds new items to the store, or updates existing items.</dd>
	 *   <dt><code>Promise <b>delete</b>(items)</code></dt>
	 *   <dd>Permanently deletes items from the store.</dd>
	 * </ul>
	 * <p>All three methods return a <code>Promise</code> that resolves to an 
	 * 'immutable' array(-like) with the fetched, changed or deleted items in it.</p>
	 * 
	 * <p>Furthermore, the store can be observed for changes by attaching a listener
	 * to the <code>change</code> event using the <code>on</code> method:</p>
	 * <code><pre>
	 * myDataStore.on('change', function() {
	 *   // The store has changed. 
	 * });
	 * </pre></code>
	 * <p>The listener(s) can be removed again using the <code>off</code> method:</p>
	 * <code><pre>
	 * myDataStore.off('change', myListener); // removes myListener from change event
	 * myDataStore.off('change'); // removes all listeners from change event
	 * </pre></code>
	 * 
	 */
	var DataStore = Class('DataStore', {
		
		initialize: function DataStore_initialize(name, url, cfg) {
			this.name = name;
			this.url = url || ''; // storetype://path/to/repository/store
			this.cfg = cfg || {};
			this.cfg.listeners = this.cfg.listeners || {};
			this.cfg.throttle = this.cfg.throttle || {};
		},
		
		on: function DataStore_on(event, listener) {
			this.cfg.listeners[event] = this.cfg.listeners[event] || [];
			this.cfg.listeners[event].push(listener);
		},

		trigger: function DataStore_trigger(event) {
			var me = this, cfg = me.cfg, listeners = cfg.listeners[event];
			if (listeners) {
				if (! cfg.throttle[event]) {
					cfg.throttle[event] = {
						triggered: Date.now()
					};					
				}
				var throttle = cfg.throttle[event];
				if (throttle.timeout &&	(Date.now() < throttle.triggered + 250)) {
					clearTimeout(throttle.timeout);
				}
				else {
					throttle.triggered = Date.now();
				}
				throttle.timeout = setTimeout(function(){
					for (var i=0,listener; listener=listeners[i]; i++) {
						listener.call(me);
					}
					throttle.timeout = null;
				}, 10);
			}
		},

		off: function DataStore_off(event, listener) {
			if (this.cfg.listeners[event]) {
				if (listener) {
					for (var i=this.cfg.listeners[event].length-1; i>=0; i--) {
						if (this.cfg.listeners[event][i] === listener) {
							return this.cfg.listeners[event].splice(i, 1);
						}
					}
				}
				else {
					var results = this.cfg.listeners[event];
					delete this.cfg.listeners[event];
					return results;
				}
			}
		},

//      ABSTRACT-------------------------------------------------------------------------------------------
//		                    'abstract' methods each datastore should have.
//      ---------------------------------------------------------------------------------------------------

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
		load: function DataStore_load(criteria, pageSize, pageIndex) {
			return new Promise(function(resolve){
				resolve([]);
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
		count: function DataStore_count(criteria) {
			return new Promise(function(resolve){
				resolve(0);
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
		 * three persistent objects <code>a</code>, <code>b</code> and <code>c</code>:</p>
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
		save: function DataStore_save(item) {
			return new Promise(function(resolve){
				resolve(item.length === undefined ? [item] : item);
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
		delete: function DataStore_delete(item) {
			return new Promise(function(resolve){
				resolve('length' in item ? item : [item]);
			});
		},
		
//      /ABSTRACT------------------------------------------------------------------------------------------
		
		toString: function DataStore_toString() {
			return '[Object ' + this.constructor.classname + ' \'' + this.name + '\' {url: \'' + this.url + '\'}]';
		}
	});

	/** Registry of datastore factories by type. */
	DataStore.typeFactories = {};
	
	/** Registers the datastore <code>factory</code> as 'protocol handler' for the given <code>type</code>. */
	DataStore.registerType = function DataStore_registerType(type, factory) {
		if (! DataStore.typeFactories[type]) {
			DataStore.typeFactories[type] = factory;
		}
	};
	
	/** Creates a new datastore from the given <code>type</code>. */
	DataStore.fromType = function DataStore_fromType(name, type, url, cfg) {
		return DataStore.typeFactories[type](name, url, cfg);
	};
	
	/** Creates a new datastore from the given <code>url</code>. */
	DataStore.fromUrl = function DataStore_fromUrl(name, url, cfg) {
		if (! url) {return null;}
		var idx = url.indexOf('://'),
			s = url.substring(0, idx), 
			type = s === 'https' ? 'http' : (s || 'http');
		return DataStore.fromType(name, type, url, cfg);
	};
	
	return DataStore;
});
