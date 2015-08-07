define(['bridalapp/class', 
		'jquery', 
		'bridalapp/log', 
		'bridalapp/persistent', 
		'bridalapp/datastore'], 
function (Class, $, log, Persistent, DataStore) {
	'use strict';
	
	var RestDataStore = Class('RestDataStore', DataStore, {
		
		initialize: function RestDataStore_initialize($super, name, url, cfg) {
			$super(name, url, cfg);
			this.cfg.retryCount = this.cfg.retryCount || 0;
			this.cfg.retryWaitTime = this.cfg.retryWaitTime || 2000;
			this.cfg.timeout = this.cfg.timeout || 10000;
			if (this.cfg.supportsSynch === undefined) {this.cfg.supportsSynch = false}
		},

		load: function RestDataStore_load(criteria, pageSize, pageIndex) {
			// TODO add criteria and paging parameters to the url
			return this.remoteRequest('GET', this.url, {criteria: criteria, pageSize: pageSize, pageIndex: pageIndex});
		},

		count: function RestDataStore_count(criteria) {
			// TODO do the right thing and implement a count query
			// needs work on the server side as well and not needed yet
			return new Promise(function(resolve, reject){
				this.remoteRequest('GET', this.url, {criteria: criteria}).then(function(items){
					resolve(items.length);
				}).catch(function(e){
					reject(e);
				});
			});  
		},

		save: function RestDataStore_save(items) {
			var all = Persistent.eachArg(items, this, function(item){return [item];});
			return this.remoteRequest('POST', this.url + '/save', all);
		},

		delete: function RestDataStore_delete(items) {
			var all = Persistent.eachArg(items, this, function(item){return [item];});
			return this.remoteRequest('DELETE', this.url, all);
		},

		synch: function RestDataStore_synch(synchRequest) {
			return this.remoteRequest('POST', this.url + '/synch', synchRequest);
		},

		remoteRequest: function RestDataStore_remoteRequest(method, url, data) {
			return (function(method, url, data, timeout, retries, retryWait){
				var THROTTLE = 5000,
					started = Date.now(),
					store = this;
				
				return new Promise(function(resolve, reject) {
					if ((method === 'GET') && data) {
						var hashIdx = url.indexOf('#'),   
							hash = hashIdx !== -1 ? url.substring(hashIdx) : '',
							qsIdx = url.indexOf('?'),
							qs = qsIdx !== -1 ? url.substring(qsIdx) : '';
							
						if (data.criteria) {
							for (var key in data.criteria) {
								if (data.criteria.hasOwnProperty(key)) {
									qs += (qs ? '&' : '') + encodeURIComponent(key) + '=' 
											+ encodeURIComponent(data.criteria[key].toString());
								}
							}
						}
						if (data.pageSize) {
							qs += (qs ? '&' : '') + 'pg=' + data.pageIndex + '&pgsz=' + data.pageSize;
						}
						url = url + qs + hash;
						data = undefined;
					}
					request(method, url, data, error, resolve, reject);
				});
				
				function info(data) {
					var info = '';
					if (data) {
						if (data.length) {info = '(' + data.length + ' items)';}
						else if (data.createdItems) {
							var parts = [];
							if (data.createdItems.length) {parts.push(data.createdItems.length + ' created');} 
							if (data.updatedItems.length) {parts.push(data.updatedItems.length + ' updated');}
							if (data.deletedItems && data.deletedItems.length) {parts.push(data.deletedItems.length + ' deleted');}
							if (data.deletedIds && data.deletedIds.length) {parts.push(data.deletedIds.length + ' deleted');}
							if (parts.length) {info = '(' + parts.join(', ') + ')';}
						}
					}
					return info;
				}
				
				function request(method, url, data, errorHandler, resolve, reject) {
					var pre = '';
					for (var i=0; i<6-method.length; i++) {pre += ' ';}
					log().log(' -> ' + pre + method + ' ' + url + ' ' + info(data));
					
					$.ajax(url, {
						method: method,
						contentType: 'application/json',
						processData: false,
						data: data && JSON.stringify(data),
						timeout: timeout
					})
					.done(function(data, statusText, jqXHR){
						if (jqXHR.responseText.indexOf('j_security_check') !== -1) {
							// login challenge from server, session expired
							log().info('401 ' + pre + method + ' ' + url + ' ' + info(data) + ' (LOGIN CHALLENGE)');
							errorHandler(jqXHR, method, url, data, resolve, reject);
						}
						else {
							log().info('200 ' + pre + method + ' ' + url + ' ' + info(data) + ' (OK)');
							retries = 0;
							resolve(Persistent.fromJSON(jqXHR.responseText));
						}
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						jqXHR.statusText = errorThrown || textStatus; 
						log().warn(jqXHR.status + ' ' + pre + method + ' ' + url + ' ' + info(data) + ' (' + jqXHR.statusText + ')');
						errorHandler(jqXHR, method, url, data, resolve, reject);
					});
				}
				
				function error(jqXHR, method, url, data, resolve, reject) {
					// status code 5xx ? possibly recoverable.
					var statusText = jqXHR.statusText;
					switch(status) {
						case 500: // Internal server error
						case 502: // Bad Gateway
						case 503: // Service unavailable
						case 504: // Gateway Timeout
							if (retries > 0) {
								retry(jqXHR, method, url, data, errorHandler, resolve, reject);
								break;
							}
	
						case 200: // Happens in case of server login challenge when unauthorized
							if (jqXHR.status == 200) {
								// TODO handle this
								statusText = 'Session expired.';
							}
						default: // unrecoverable or too many tries. give up 
							retries = 0;
							var err = new Error(jqXHR.status + ' ' + statusText);
							err.status = jqXHR.status;
							err.statusText = statusText;
							err.request = jqXHR;
							err.method = method;
							err.url = url;
							err.data = data;
							reject(err);
					}
				}
				
				function retry(jqXHR, method, url, data, errorHandler, resolve, reject) {
					retries--;
					var after = 3000; // 5 minutes
					var retryAfter = jqXHR.getResponseHeader('Retry-After');
					if (retryAfter) {
						var tmp = parseInt(retryAfter, 10);
						if (! isNaN(tmp)) {
							after = tmp * 1000; // seconds to ms.
						}
					}
					
					setTimeout(function(){
						request(method, url, data, errorhandler, resolve, reject);
					}, after);
				}
			})(method, url, data, this.cfg.timeout, this.cfg.retryCount, this.cfg.retryWaitTime);
		}
	});

	function RestDataStoreFactory(name, url, cfg) {
		return new RestDataStore(name, url, cfg);
	}
	
	DataStore.registerType('http', RestDataStoreFactory);
	DataStore.registerType('https', RestDataStoreFactory);

	return RestDataStore;
});
