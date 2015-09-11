define(['bridalapp/class', 
		'bridalapp/syncheddatastore', 
		'bridalapp/localdatastore', 
		'bridalapp/restdatastore',
], 
function (Class, SynchedDataStore) {
	var Stock = Class('Stock', SynchedDataStore, {
		initialize: function Stock_initialize($super) {
			$super('stock', 'synched://local/bridal-app/stock#http/api/stock');
			this.cfg.remoteDataStore.cfg.supportsSynch = true;
		}
	});

	return new Stock();
});
