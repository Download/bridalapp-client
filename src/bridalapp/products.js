define(['lang/class', 'jquery', 'bridalapp/syncheddatastore', 'bridalapp/rhaboodatastore', 'bridalapp/restdatastore'], function (Class, $, SynchedDataStore) {
	var Products = Class('Products', SynchedDataStore, {
		initialize: function Products_initialize($super) {
			$super('products', 'synched://rhaboo/bridal-app/products#http/api/products');
			this.cfg.remoteDataStore.cfg.supportsSynch = true;
		}
	});

	return new Products();
});
