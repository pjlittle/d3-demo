module.exports = function(grunt) {

    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        
        pkg: grunt.file.readJSON('package.json'),

        bower: {
            install: {
                options: {
                    targetDir: 'src/js/libs',
                    layout: 'byComponent'
                }
            }
        },

        clean: {
            dev: ['public'],
            js: ['src/js/libs']
        },

        copy: {
            dev: {
                files: [
                {
                    src: 'src/js/*.js',
                    dest: 'public/js/',
                    filter: 'isFile',
                    flatten: true,
                    expand: true
                },
                {
                    src: 'src/js/libs/**/*.js',
                    dest: 'public/js/',
                    filter: 'isFile',
                    flatten: true,
                    expand: true
                },
                {
                    src: 'src/css/*.css',
                    dest: 'public/css/',
                    filter: 'isFile',
                    flatten: true,
                    expand: true
                },
                {
                    src: 'src/js/libs/**/*.css',
                    dest: 'public/css/',
                    filter: 'isFile',
                    flatten: true,
                    expand: true
                },
                {
                    src: 'src/js/libs/**/*.map',
                    dest: 'public/css/',
                    filter: 'isFile',
                    flatten: true,
                    expand: true
                }, {
                    src: 'src/js/libs/*/fonts/*',
                    dest: 'public/fonts/',
                    filter: 'isFile',
                    flatten: true,
                    expand: true
                }, {
                    src:['**'],
                    dest: 'public/img/',
                    filter: 'isFile',
                    flatten: false,
                    cwd: 'src/img/',
                    expand: true
                }, {
                    src:['src/index.html'],
                    dest: 'public/',
                    filter: 'isFile',
                    flatten: true,
                    expand: true
                } ]
            }
        },

        // for changes to the front-end code
        watch: {
            scripts: {
                files: ['src/**/*'],
                tasks: ['clean:dev', 'copy:dev']
            },
            css: {
                files: ['src/css/**/*.css'],
                tasks: ['copy:dev']
            }
        },

        // for changes to the node code
        nodemon: {
            dev: {
                options: {
                    file: 'server.js',
                    nodeArgs: ['--debug'],
                    watchedFolders: ['app'],
                    env: {
                        PORT: '3300'
                    }
                }
            }
        },

        concurrent: {
            dev: {
                tasks: ['nodemon:dev', 'watch:scripts'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },

        jshint: {
            all: ['Gruntfile.js', 'src/js/**/*.js', '!src/app/js/libs/**/*.js'],
            dev: ['src/js/*.js', '!src/app/js/libs/**/*.js']
        }
     });

    grunt.registerTask('init:dev', ['clean', 'bower']);
    grunt.registerTask('build:dev', ['clean:dev', 'jshint:dev', 'copy:dev']);
    grunt.registerTask('server:node', ['build:dev', 'concurrent:dev']);
};
