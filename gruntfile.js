module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	
	grunt.initConfig({
		version: grunt.file.readJSON('package.json').version,
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: ['src/*.js']
		},

		jsdoc: {
			dist: {
				src: ['src/bridalapp.js'],
				options: {
					destination: 'doc'
				}
			}
		},
		
		requirejs: {
			compile: {
				options: {
					name: 'bridalapp',
					out: 'dist/bridalapp.min.js',
					baseUrl: 'src/',
					paths: {
						'suid': 'empty:',
						'jquery': 'empty:',
						'rhaboo': 'empty:'
					},
					keepBuildDir: true,
					preserveLicenseComments: false,
					generateSourceMaps: true,
					optimize: 'uglify2',
					//optimize: 'none',
				}
			}
		}		
	});

	/**
	 * Default tasks
	 */
	grunt.registerTask('default', [
		'jshint',
		'requirejs',
		'jsdoc'
	]);
};