define(['lang/class', 'jquery', 'bridalapp/syncheddatastore', 'bridalapp/rhaboodatastore', 'bridalapp/restdatastore'], function (Class, $, SynchedDataStore) {
	var Ratings = Class('Ratings', SynchedDataStore, {
		initialize: function Ratings_initialize($super) {
			$super('ratings', 'synched://rhaboo/bridal-app/ratings#http/api/ratings');
			this.cfg.remoteDataStore.cfg.supportsSynch = true;
		}
	});

	return new Ratings();
});
