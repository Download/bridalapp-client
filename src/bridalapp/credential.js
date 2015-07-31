define(['lang/class', 'bridalapp/persistent'], function(Class, Persistent){
	var Credential = Class('Credential', Persistent, {
		initialize: function($super, obj) {
			$super(obj);
		}
	});
	
	return Credential;
});