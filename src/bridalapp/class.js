define([], function(){
	/**
	 * Class([name] [, parent], object [, object] [, object])
	 *
	 * Creates a new class with the given name, parent and methods.
	 *
	 * name    String, Optional. The name of the new class. 
	 *         If not specified the new class will be anonymous.
	 * parent  Class object, optional. The parent class for the new class.
	 * object  Object, Required. One or more objects containing the methods 
	 *         and fields to add to the new class.
	 */
	function Class() {
		var name = '', parent = null, args = arrayify(arguments);
		if (typeof args[0] === 'string' || args[0] instanceof String) {
			name = args.shift();
		}
		if (typeof args[0] === 'function') {
			parent = args.shift();
		}
		var classname = name || 'klass';
		eval('var klass = function ' + classname + '() {this.initialize.apply(this, arguments);}'); // jshint ignore:line
		klass.classname = classname;
		klass.superclass = parent;
		klass.subclasses = [];

		if (parent) {
			var subclass = function() { };
			subclass.prototype = parent.prototype;
			klass.prototype = new subclass();
			parent.subclasses.push(klass);
		}

		for (var i=0, len=args.length; i<len; i++) {
			addMethods(klass, args[i]);
		}
		if (!klass.prototype.initialize) {
			klass.prototype.initialize = function() { };
		}
		klass.prototype.constructor = klass;
		return klass;
	}

	Class.subclass = function Class_subclass(klass, name) {
		if (!klass) {return;}
		if (klass.classname === name) {return klass;}
		for (var i=0, sub; sub=klass.subclasses[i]; i++) {
			if (sub.classname === name) {return sub;}
			var subsub = Class.subclass(sub, name);
			if (subsub) {return subsub;}
		}
	};

	function argumentNames(fn) {
		var i, len, names = fn.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(',');
		for (i=0, len=names.length; i<len; i++) {
			names[i] = names[i].replace(/^\s+/, '').replace(/\s+$/, '');
		}
		return len === 1 && !names[0] ? [] : names;
	}

	function arrayify(it) {
		if (!it) {return [];}
		if ('toArray' in Object(it)) {return it.toArray();}
		var len = it.length || 0, results = new Array(len);
		while (len--) {results[len] = it[len];}
		return results;
	}

	function bind(func) {
		if (arguments.length < 3 && arguments[1] === undefined) {return func;}
		var args = arrayify(arguments), obj = args.splice(0, 2)[1];
		return function() {
			return func.apply(obj, args.concat(arrayify(arguments)));
		};
	}

	function wrap(func, wrapper) {
		return function() {
			return wrapper.apply(this, [bind(func, this)].concat(arrayify(arguments)));
		};
	}

	function addMethods(klass, src) {
		function keys(obj) {
			var results = [];
			for (var key in obj) {
				results.push(key);
			}
			return results;
		}

		var ancestor = klass.superclass && klass.superclass.prototype, props = keys(src);

		for (var i=0, key; key=props[i]; i++) {
			var val = src[key];
			if (ancestor && (typeof val === 'function')) {
				var argNames = argumentNames(val);
				if ((argNames.length > 0) && (argNames[0] === '$super')) {
					var method = val;
					val = wrap((function(m) {
						return function() {
							return ancestor[m].apply(this, arguments); 
						};
					})(key), method); // jshint ignore:line
					val.valueOf = bind(method.valueOf, method);
					val.toString = bind(method.toString, method);
				}
			}
			klass.prototype[key] = val;
		}
	}

	return Class;
});
