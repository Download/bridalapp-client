define(['bridalapp/class', 'bridalapp/named'], function(Class, Named){
	var Product = Class('Product', Named, {
		initialize: function($super, obj) {
			$super(obj);
		}
	});
	
	return Product;
});