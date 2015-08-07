define(['bridalapp/class', 'bridalapp/named'], function(Class, Named){
	var Category = Class('Category', Named, {
		initialize: function($super, obj) {
			$super(obj);
		}
	});

	return Category;
});