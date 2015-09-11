define(['bridalapp/class', 'bridalapp/persistent'], function (Class, Persistent) {
	var Named = Class('Named', Persistent, {
		initialize: function Named_initialize($super, obj) {
			this.name = '';
			$super(obj);
		},
		
		toString: function Named_toString() {
			return '[Object ' + this.type + ' \'' + this.name + '\' ' + this.id.toString() + ' v' + this.version + ']';
		}
	});
	
	return Named;
});
