define(['lang/class', 'suid'], function (Class, Suid) {
	var Persistent = Class('Persistent', {
		initialize: function Persistent_initialize(obj) {
			this.id = (obj && obj.id) || Suid(0);
			this.type = this.constructor.classname;
			this.version = obj && (obj.version !== undefined) ? obj.version : null;
		},
		
		equals: function Persistent_equals(other){
			return other && (
					(other instanceof Persistent && other.id.value === this.id.value) ||
					(other instanceof Suid && other.value === this.id.value) || 
					(other == this.id.value) 
			) ;
		},
		
		toString: function Persistent_toString() {
			return '[Object ' + this.type + ' ' + this.id.toString() + ' v' + this.version + ']';
		}
	});
	
	Persistent.revive = function Persistent_revive(key, value) {
		var t = value && typeof value === 'object' && typeof value.type === 'string' && value.type,
			constructor = Class.subclass(Persistent, t);
		return constructor ? new constructor(value) : Suid.revive(key, value);
	}; 
	
	Persistent.fromJSON = function Persistent_fromJSON(json) {
		return JSON.parse(json, Persistent.revive);
	};
	
	Persistent.persistent = function Persistent_persistent(arg) {
		if (arguments.length === 1) {return arg instanceof Persistent && arg.version !== null;}
		var results = [];
		for (var i=0; arg=arguments[i]; i++) {
			if (Persistent.persistent(arg)) {results.push(arg);}
			else if ('length' in arg){
				for (var j=0, item; item=arg[j]; j++) {
					if (Persistent.persistent(item)) {results.push(item);}
				}
			}
		}
		return results;
	};
	
	Persistent.equals = function Persistent_static_equals(one, other, comparator) {
		return (one == other ||
				(comparator && comparator(one, other) === 0) ||
				one && one.equals && one.equals(other) ||
				other && other.equals && other.equals(one) ||
				(typeof one === 'object' && one && one.valueOf() == other) ||
				(typeof other === 'object' && other && other.valueOf() == one));
	};
	
	// returns index of given element in given list, using given comparator
	Persistent.indexOf = function Persistent_indexOf(list, element, comparator) {
		for (var i=0, item; item=list[i]; i++) {
			if (Persistent.equals(item, element)) {
				return i;
			}
		}
		return -1;
	};

	// CRITERIA on the cheap
	Persistent.matches = function Persistent_matches(items, criteria) {
		var results = Array.prototype.concat.call(items || []);
		if (criteria) {
			for (var i=results.length-1; i>=0; i--) {
				for (var key in criteria) {
					if (criteria.hasOwnProperty(key)) {
						if ((((Array.isArray && Array.isArray(criteria[key])) || (criteria[key] instanceof Array)) && (Persistent.indexOf(criteria[key], items[i][key]) === -1)) 
								|| (! Persistent.equals(items[i][key], criteria[key]))) {
							results.splice(i,1); 
						}
					}
				}
			}
		}
		return results;
	};
	
	Persistent.pluck = function Persistent_pluck(items, attr) {
		var results = [];
		for (var i=0,item; item=items[i]; i++) {
			if (item[attr] !== undefined) {
				results.push(item[attr]); 
			}
		}
		return results;
	};
	
	Persistent.clone = function Persistent_clone(items) {
		var results = [];
		if (arguments.length > 1) {return Persistent.clone(arguments);}
		if (! ('length' in items)) {return items instanceof Persistent && items.clone ? items.clone() : Persistent.fromJSON(JSON.stringify(items));}
		var results = [];
		for (var i=0, item; item=items[i]; i++) {
			results.push(Persistent.clone(item));
		}
		return results;
	};
	
	Persistent.page = function Persistent_page(results, pageSize, pageIndex) {
		if (pageSize) {
			var start = (pageIndex || 0) * pageSize,
				end = pageIndex * (pageSize+1);
			if ((end < 0) || (end <= start) || (start > results.length)) {return [];}
			return results.slice(Math.max(start,0), Math.min(end, results.length));
		}
		return results;
	};
	
	Persistent.eachArg = function Persistent_eachArg(args, obj, fn) {
		if (('length' in args) && (! (args instanceof Persistent))) {
			var results = [];
			for (var i=0,item; item=args[i]; i++) {
				results.push.apply(results, Persistent.eachArg(item, obj, fn));
			}
			return results;
		}
		return fn.call(obj, args);
	}
	
	return Persistent;
});
