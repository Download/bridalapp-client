define(['bridalapp/class', 'bridalapp/named'], function(Class, Named){
	var Store = Class('Store', Named, {
		initialize: function($super, obj) {
			$super(obj);
		}
	});
	
	return Store;
});