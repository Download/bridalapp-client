define(['lang/class'], function(Class){
	var SynchResponse = Class('SynchResponse', {
		initialize: function(obj) {
			this.createdItems = (obj && obj.createdItems) || [];
			this.updatedItems = (obj && obj.updatedItems) || [];
			this.staleItems = (obj && obj.staleItems) || [];
			this.failedItems = (obj && obj.failedItems) || [];
			this.deletedIds = (obj && obj.deletedIds) || [];
		}
	});
	
	return SynchResponse;
});