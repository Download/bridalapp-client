define(['bridalapp/class', 'bridalapp/named'], function(Class, Named){
	var Group = Class('Group', Named, {
		initialize: function($super, obj) {
			$super(obj);
			this.description = (obj && obj.description) || null;
		}
	});

	return Group;
});