define(['bridalapp/class', 'bridalapp/named', 'suid'], function(Class, Named, Suid){
	var Role = Class('Role', Named, {
		initialize: function($super, obj) {
			$super(obj);
		}
	});
	
	Role.GUEST = new Role({id:Suid(1), name:'Guest'});
	Role.USER = new Role({id:Suid(2), name:'User'});
	Role.STORE_USER = new Role({id:Suid(3), name:'Store-User'});
	Role.STORE_MANAGER = new Role({id:Suid(4), name:'Store-Manager'});
	Role.BRAND_USER = new Role({id:Suid(5), name:'Brand-User'});
	Role.BRAND_MANAGER = new Role({id:Suid(6), name:'Brand-Manager'});
	Role.BRAUTSCHLOSS_USER = new Role({id:Suid(7), name:'Brautschloss-User'});
	Role.BRAUTSCHLOSS_MANAGER = new Role({id:Suid(8), name:'Brautschloss-Manager'});
	Role.ADMINISTRATOR = new Role({id:Suid(9), name:'Administrator'});
	
	return Role;
});