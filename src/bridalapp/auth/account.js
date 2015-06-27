define(['lang/class', 'bridalapp/named'], function(Class, Named){
	var Account = Class('Account', Named, {
		initialize: function($super, obj) {
			$super(obj);
			this.credentials = (obj && obj.credentials) || [];
		}
	});

	return Account;
});