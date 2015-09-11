define(['bridalapp/class'], function(Class){
	var Country = Class('Country', {
		initialize: function(name, code) {
			if (typeof name === 'object') {
				code = name.code;
				name = name.name;
			}
			this.name = name;
			this.code = code;
		}
	});

	return Country;
});