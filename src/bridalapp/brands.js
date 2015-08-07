define(['bridalapp/class', 
		'bridalapp/syncheddatastore',
		'bridalapp/rhaboodatastore', 
		'bridalapp/restdatastore',
],
function (Class, SynchedDataStore) {
	var Brands = Class('Brands', SynchedDataStore, {
		initialize: function Brands_initialize($super) {
			$super('brands', 'synched://rhaboo/bridal-app/brands#http/api/brands');
		}
	});

	return new Brands();
});
