define(['bridalapp/class', 'bridalapp/credential'], function(Class, Credential){
	var PasswordCredential = Class('PasswordCredential', Credential, {
		initialize: function($super, obj) {
			$super(obj);
		}
	});
	
	return PasswordCredential;
});