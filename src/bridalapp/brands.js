define(['bridalapp/class', 
		'bridalapp/syncheddatastore',
		'bridalapp/localdatastore', 
		'bridalapp/restdatastore',
],
function (Class, SynchedDataStore) {
	var Brands = Class('Brands', SynchedDataStore, {
		initialize: function Brands_initialize($super) {
			$super('brands', 'synched://local/bridal-app/brands#http/api/brands');
		}
	});

	return new Brands();
});
