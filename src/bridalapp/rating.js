define(['bridalapp/class', 'bridalapp/persistent'], function(Class, Persistent){
	var Rating = Class('Rating', Persistent, {
		initialize: function($super, obj) {
			$super(obj);
		},
	
		toStringProperties: function($super) {
			return $super() + ' ' + this.score + ' ' + this.productId
		}
	});

	return Rating;
});