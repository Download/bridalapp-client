define(['bridalapp/class', 
		'bridalapp/syncheddatastore', 
		'bridalapp/localdatastore', 
		'bridalapp/restdatastore',
], 
function (Class, SynchedDataStore) {
	var Products = Class('Products', SynchedDataStore, {
		initialize: function Products_initialize($super) {
			$super('products', 'synched://local/bridal-app/products#http/api/products');
			this.cfg.remoteDataStore.cfg.supportsSynch = true;
		}
	});

	return new Products();
});
