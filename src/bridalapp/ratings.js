define(['bridalapp/class', 
		'bridalapp/syncheddatastore',
		'bridalapp/localdatastore',
		'bridalapp/restdatastore',
], 
function (Class, SynchedDataStore) {
	var Ratings = Class('Ratings', SynchedDataStore, {
		initialize: function Ratings_initialize($super) {
			$super('ratings', 'synched://local/bridal-app/ratings#http/api/ratings');
			this.cfg.remoteDataStore.cfg.supportsSynch = true;
		}
	});

	return new Ratings();
});
