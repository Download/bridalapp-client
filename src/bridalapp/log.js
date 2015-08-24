define([], function () {
	var METHODS = ['log','info','warn','error'],
		out = ('console' in this) && console.error ? console : {},
		con = {}, // save backups of native console functions here
		nul = {}, // keep empty console functions here
		i, key;

	for (i=0; key=METHODS[i]; i++) {
		nul[key] = function(){};
		con[key] = out[key] || nul[key];
	}

	function log() {
		return out;
	}

	log.level = function log_level(lvl) {
		if ((lvl !== undefined) && (lvl >= 0) && (lvl <= 4) && (lvl !== logLevel)) {
			logLevel = lvl;
			// modify the console methods: 
			// those which are below the current log level get replaced by empty functions
			for (var i=0,fn; fn=METHODS[i]; i++) {
				out[fn] = i >= lvl ? con[fn] : nul[fn];
			}
		}
		return logLevel;
	};

	log.level.DEBUG = 0;
	log.level.INFO = 1;
	log.level.WARN = 2;
	log.level.ERROR = 3;
	log.level.NONE = 4;
	
	var logLevel = log.level(log.level.INFO);

	return log;
});
