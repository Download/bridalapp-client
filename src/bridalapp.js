/**!
 * @copyright (c) 2015 by Stijn de Witt. Some rights reserved.
 * @license <a href="https://creativecommons.org/licenses/by/4.0/">Attribution 4.0 International (CC BY 4.0)</a> 
 */
define([
		// Pull in all classes
		'bridalapp/account', 
		'bridalapp/brand',
		'bridalapp/brands',
		'bridalapp/category',
		'bridalapp/credential',
		'bridalapp/group',
		'bridalapp/log', 
		'bridalapp/named',
		'bridalapp/password-credential', 
		'bridalapp/persistent',
		'bridalapp/product',
		'bridalapp/products',
		'bridalapp/rating',
		'bridalapp/ratings',
		'bridalapp/role'
	], 
	
	function(
		Account, 
		Brand,
		Brands,
		Category,
		Credential,
		Group,
		log,
		Named,
		PasswordCredential, 
		Persistent,
		Product,
		Products,
		Rating,
		Ratings,
		Role
	){
		// Create a namespace with all classes in it and return it
		return {
			Account: Account, 
			Brand: Brand,
			Brands: Brands,
			Category: Category,
			Credential: Credential,
			Group: Group,
			log: log,
			Named: Named,
			PasswordCredential: PasswordCredential, 
			Persistent: Persistent,
			Product: Product,
			Products: Products,
			Rating: Rating,
			Ratings: Ratings,
			Role: Role,
			
			globalize: function(global){
				for (var key in this) {
					if (this.hasOwnProperty(key)) {
						global[key] = this[key];
					}
				}
			}
		};
	}
);