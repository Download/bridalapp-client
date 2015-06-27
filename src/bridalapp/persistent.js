define(['lang/class', 'suid'], function (Class, Suid) {
	var Persistent = Class('Persistent', {
		initialize: function Persistent_initialize(obj) {
			this.id = (obj && obj.id) || Suid();
			this.type = this.constructor.classname;
			this.version = (obj && obj.version) || 0;
		},
		
		toString: function Persistent_toString() {
			return '[Object ' + this.type + ' ' + this.id.toString() + ' v' + this.version + ']';
		}
	});
	
	Persistent.revive = function Persistent_revive(key, value) {
		var t = typeof value === 'object' && typeof value.type === 'string' && value.type,
			constructor = Class.subclass(Persistent, t);
		return constructor ? new constructor(value) : Suid.revive(key, value);
	}; 
	
	Persistent.fromJSON = function Persistent_fromJSON(json) {
		return JSON.parse(json, Persistent.revive);
	};
	
	return Persistent;
});
