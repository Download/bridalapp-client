define(['lang/class'], function(Class){
	var SynchRequest = Class('SynchRequest', {
		initialize: function(obj) {
			this.unsynchedDuration = (obj && obj.synchDuration) || 0;
			this.criteria = (obj && obj.criteria) || null;
			this.currentIds = (obj && obj.currentIds) || [];
			this.currentVersions = (obj && obj.currentVersions) || [];
			this.createdItems = (obj && obj.createdItems) || [];
			this.updatedItems = (obj && obj.updatedItems) || [];
			this.deletedItems = (obj && obj.deletedItems) || [];
		}
	});
	
	return SynchRequest;
});