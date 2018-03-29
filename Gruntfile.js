/* eslint import/no-extraneous-dependencies: 0 */

module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');


  grunt.initConfig({

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*.html', '!**/*.js', '**/*.css'],
        dest: 'dist'
      },
      pluginDef: {
        expand: true,
        src: [ 'plugin.json', 'README.md', 'CHANGELOG.md' ],
        dest: 'dist',
      },

      img_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['images/*'],
        dest: 'dist/'
      },
      
      leaflet: { 
        cwd: 'node_modules/leaflet/dist/',
        expand: true,
        src: ['**/*'], 
        dest: 'dist/vendor/leaflet'
      },
      
      highchartsCss: { 
        cwd: 'node_modules/highcharts/css/',
        expand: true,
        src: ['highcharts.css'], 
        dest: 'dist/vendor/highcharts'
      }
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015'],
        plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of'],
      },
      dist: {
        files: [
          {
            cwd: 'src',
            expand: true,
            src: ['**/*.js'],
            dest: 'dist',
            ext: '.js'
          },
          { 
            cwd: 'node_modules/highcharts/',
            expand: true,
            src: ['highstock.js'],
            dest: 'dist/vendor/highcharts'
          }
        ]
      },
    },

  });

  grunt.registerTask('default', ['copy:src_to_dist', 'copy:pluginDef', 'copy:img_to_dist', 'copy:leaflet', 'copy:highchartsCss', 'babel']);
};
