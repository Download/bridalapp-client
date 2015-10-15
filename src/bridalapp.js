/*! 
[bridalapp-client 0.9.13](http://github.com/download/bridalapp-client). Copyright 2015 by [Stijn de Witt](http://StijnDeWitt.com). Some rights reserved. License: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) */
define([
		'bridalapp/localdatastore',
		'bridalapp/restdatastore',
		// Pull in all classes
		'bridalapp/account', 
		'bridalapp/brand',
		'bridalapp/brands',
		'bridalapp/category',
		'bridalapp/country',
		'bridalapp/countries',
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
		'bridalapp/role',
		'bridalapp/stockitem',
		'bridalapp/stock',
		'bridalapp/store',
		'bridalapp/stores'
	], 

function(
	LocalDataStore,
	RestDataStore,
	Account, 
	Brand,
	Brands,
	Category,
	Country,
	Countries,
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
	Role,
	StockItem,
	Stock,
	Store,
	Stores
){
	// Create a namespace with all classes in it and return it
	return {
		STATIC: 'https://cdn.rawgit.com/download/bridalapp-static/0.9.8',
		APIKEY: 'AIzaSyB75slLBHVw8DPQRRyYq6ZDjNuml3ZB_a4', // PRODUCTION

		Account: Account, 
		Brand: Brand,
		Brands: Brands,
		Category: Category,
		Country: Country,
		Countries: Countries,
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
		StockItem: StockItem,
		Stock: Stock,
		Store: Store,
		Stores: Stores,

		globalize: function(global){
			for (var key in this) {
				if (this.hasOwnProperty(key) && (key !== 'globalize')) {
					global[key] = this[key];
				}
			}
		}
	};
}
);