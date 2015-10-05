define(['bridalapp/class', 'bridalapp/named'], function(Class, Named){
	var Store = Class('Store', Named, {
		initialize: function($super, obj) {
			$super(obj);
		},
		
		getFullAddress: function() {
			return this.address1 + (this.address2 ? ', ' + this.address2 : '') + ', ' 
				+ this.postalCode + ' ' + this.city + (this.state ? ', ' + this.state : '') + ', '
				+ Countries.byCode(this.countryCode)[0].name;
		}
	});
	
	return Store;
});