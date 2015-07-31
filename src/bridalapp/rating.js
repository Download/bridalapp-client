define(['lang/class', 'bridalapp/persistent'], function(Class, Persistent){
	var Rating = Class('Rating', Persistent, {
		initialize: function($super, obj) {
			$super(obj);
			this.productId = (obj && obj.productId) || null;
			this.accountId = (obj && obj.accountId) || null;
			this.score = (obj && obj.score) || null;
		}
	});

	return Rating;
});