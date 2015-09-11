define(['bridalapp/class', 'bridalapp/persistent'], function(Class, Persistent){
	var StockItem = Class('StockItem', Persistent, {
		initialize: function StockItem_initialize($super, obj) {
			$super(obj);
		}
	});
	
	return StockItem;
});