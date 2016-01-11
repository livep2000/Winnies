module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('BVFS', ['browserify:BVFS', 'copy:html']);
	grunt.registerTask('core', ['clean:prod', 'browserify:core', 'copy:html', 'copy:repo']);
	grunt.registerTask('prod', ['clean:prod', 'browserify:BVFS', 'uglify:BVFS', 'browserify:core', 'uglify:core', 'copy:prod', 'uglify:apps']);

	var browserifyFilesBVFS = { 'build/BVFSbundle.js': ['source/js/BVFS.js'] };
	var uglifyFilesBVFS = { 'BVFSbundle.js': ['build/BVFSbundle.js'] };

	var browserifyFilesCore = { 'source/repository/system/winnies/index.js': ['source/js/core.js'] };
	var uglifyFilesCore = { 'source/repository/system/winnies/index.js': ['source/repository/system/winnies/index.js'] };

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			BVFS: {
				files: browserifyFilesBVFS,
				options: { debug: true }
			},
			core: {
				files: browserifyFilesCore,
				options: { debug: true }
			},
		},

		uglify: {
			BVFS: {
				files: uglifyFilesBVFS
			},
			core: {
				files: uglifyFilesCore
			},
			apps: {
				files: grunt.file.expandMapping(['build/repository/**/*.js'], '', {
					rename: function (destBase, destPath) {
						return destBase + destPath;
					}
				})
			}
		},

		clean: {
			dev: ["build/repository/", "index.html"],
			prod: ["build/repository/", "index.html"]
		},
		copy: {
			html: {
				files: [
				{ expand: true, flatten: true, src: ['source/index.html'], dest: 'build', filter: 'isFile' }
				]
			},
			repo: {
				files: [
					{ expand: true, cwd: 'source/repository', src: ['**'], dest: 'build/repository' }
				]
			},
			prod: {
				files: [
					{ expand: true, flatten: true, src: ['source/index.html'], dest: 'build', filter: 'isFile' },
					{ expand: true, cwd: 'source/repository', src: ['**'], dest: 'build/repository' }
				]
			},
			dev: {
				files: [
					{ expand: true, cwd: 'source/repository', src: ['**'], dest: 'build/repository' },
					{ expand: true, flatten: true, src: ['source/index.html'], dest: 'build', filter: 'isFile' }
				]
			}
		}

	});
};