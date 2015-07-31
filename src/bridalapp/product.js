define(['lang/class', 'bridalapp/named'], function(Class, Named){
	var Product = Class('Product', Named, {
		initialize: function($super, obj) {
			$super(obj);
			this.description = (obj && obj.description) || null;
			this.priceWholesaleEuroCent = (obj && obj.priceWholesaleEuroCent) || null;
			this.priceConsumerEuroCent = (obj && obj.priceConsumerEuroCent) || null;
			this.brandId = (obj && obj.brandId) || null;
			this.brandName = (obj && obj.brandName) || null;
			this.categoryId = (obj && obj.categoryId) || null;
			this.categoryName = (obj && obj.categoryName) || null;
			this.tags = (obj && obj.tags) || null;
		}
	});
	
	return Product;
});