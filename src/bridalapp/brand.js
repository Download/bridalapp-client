define(['bridalapp/class', 'bridalapp/named'], function(Class, Named){
	var Brand = Class('Brand', Named, {
		initialize: function($super, obj) {
			$super(obj);
		}
	});

	return Brand;
});