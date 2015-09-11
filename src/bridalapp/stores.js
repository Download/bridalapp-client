define(['bridalapp/class', 
		'bridalapp/syncheddatastore', 
		'bridalapp/localdatastore', 
		'bridalapp/restdatastore',
], 
function (Class, SynchedDataStore) {
	var Stores = Class('Stores', SynchedDataStore, {
		initialize: function Stores_initialize($super) {
			$super('stores', 'synched://local/bridal-app/stores#http/api/stores');
			this.cfg.remoteDataStore.cfg.supportsSynch = true;
		}
	});

	return new Stores();
});
