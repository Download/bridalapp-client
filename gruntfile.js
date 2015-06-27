module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	
	grunt.initConfig({
		version: grunt.file.readJSON('package.json').version,
		pkg: grunt.file.readJSON('package.json'),

		// chech our JS
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: ['src/*.js']
		},

		// minify JS
		uglify: {
			options:{
				banner : '/*! [BridalApp Client <%= version %>](http://bridalapp.net) copyright 2015 by [Stijn de Witt](http://StijnDeWitt.com), all rights reserved. */',
//				mangle: {
//					except: ''
//				},
				sourceMap: true
			},
			admin: {
				files: {
					'dist/bridalapp.min.js': ['src/bridalapp.js']
				}
			}
		}
		
		,

		jsdoc: {
			dist: {
				src: ['src/bridalapp.js'],
				options: {
					destination: 'doc'
//					,
//					template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
//					configure: "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json"
				}
			}
		}
		
		,
		
		requirejs: {
			compile: {
				options: {
					name: 'bridalapp',
					out: 'dist/bridalapp.min.js',
					baseUrl: 'src/',
					paths: {
						'suid': 'https://cdn.rawgit.com/download/suid/0.9.11/dist/suid.min'
					},
					keepBuildDir: true,
					preserveLicenseComments: false,
					generateSourceMaps: true,
					optimize: 'uglify2',
				}
			}
		}		
	});

	// 
	
	/**
	 * Default tasks
	 */
	grunt.registerTask( 'default', [
		'jshint',
		'requirejs',
//		'uglify',
		'jsdoc'
//		,
//		'notify:dist'
	] );

	/**
	 * Dev tasks
	 *
	 * The main tasks for development
	 */
	grunt.registerTask('dev', [
		'jshint',
		'uglify',
		'jsdoc'
//		,
//		'watch'
	]);
};