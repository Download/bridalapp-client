define(['bridalapp/class', 'bridalapp/credential'], function(Class, Credential){
	var PasswordCredential = Class('PasswordCredential', Credential, {
		initialize: function($super, obj) {
			$super(obj);
			this.password = (obj && obj.password) || null;
		}
	});
	
	return PasswordCredential;
});