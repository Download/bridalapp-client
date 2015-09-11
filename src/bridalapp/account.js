define(['bridalapp/class', 'bridalapp/persistent', 'bridalapp/named'], function(Class, Persistent, Named){
	var Account = Class('Account', Named, {
		initialize: function($super, obj) {
			this.roles = []; // may be overwritten in super call
			this.groups = [];
			this.credentials = [];
			$super(obj);
		},
		
		is: function Account_is(role) {
			return Persistent.indexOf(this.roles, role) !== -1;
		},
		
		isAny: function accountIsAny(roles) {
			for (var i=0,role; role=roles[i]; i++) {
				if (this.is(role)) {return true;}
			}
			return false;
		},
		
		isAll: function Account_isAll(roles) {
			for (var i=0,role; role=roles[i]; i++) {
				if (!this.is(role)) {return false;}
			}
			return true;
		}
	});

	return Account;
});