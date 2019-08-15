/* eslint import/no-extraneous-dependencies: 0 */

module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt);

  // grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-clean');
  // grunt.loadNpmTasks('grunt-postcss');

  grunt.initConfig({
    clean: ['dist'],
    copy: {
      srcToDist: {
        cwd: 'src',
        expand: true,
        src: ['plugin.json', '**/*.html', '!**/*.js', '**/*.css'],
        dest: 'dist'
      },
      pluginDef: {
        expand: true,
        src: [ 'LICENSE', 'README.md', 'CHANGELOG.md' ],
        dest: 'dist',
      },

      imgToDist: {
        cwd: 'src',
        expand: true,
        src: ['img/**/*'],
        dest: 'dist/'
      },

      leaflet: {
        cwd: 'node_modules/leaflet/dist/',
        expand: true,
        src: ['**/*'],
        dest: 'dist/vendor/leaflet'
      },

      highcharts: {
        cwd: 'node_modules/highcharts/',
        expand: true,
        src: ['highcharts.*', 'highstock.*', 'themes/dark-unica.*', 'themes/dark-unica.*', 'modules/exporting.*'],
        dest: 'dist/vendor/highcharts'
      },

      turf: {
        cwd: 'node_modules/turf',
        expand: true,
        src: ['**/*'],
        dest: 'dist/vendor/turf'
      },

      leafletAwesomeMarkers: {
        cwd: 'node_modules/leaflet.awesome-markers/dist/',
        expand: true,
        src: ['**/*'],
        dest: 'dist/vendor/leaflet.awesome-markers'
      },

      leafletMarkerCluster: {
        cwd: 'node_modules/leaflet.markercluster/dist/',
        expand: true,
        src: ['**/*'],
        dest: 'dist/vendor/leaflet.markercluster'
      },
      leafletSleep: {
        cwd: 'node_modules/leaflet-sleep/',
        expand: true,
        src: ['Leaflet.Sleep.js'],
        dest: 'dist/vendor/leaflet-sleep/'
      },


    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['@babel/preset-env']
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
        ]
      },
    },

    // postcss: {
    //   options: {
    //     map: true, // inline sourcemaps

    //     processors: [
    //       require('pixrem')(), // add fallbacks for rem units
    //       require('autoprefixer')({browsers: 'last 2 versions'}), // add vendor prefixes
    //       //require('cssnano')() // minify the result TO-DO: just for production
    //     ]
    //   },
    //   dist: {
    //     cwd: 'src',
    //     expand: true,
    //     src: ['*css/*.css'],
    //     dest: 'dist'
    //   }
    // }

  });

  grunt.registerTask('default', [
    'clean',
    'copy:srcToDist',
    'copy:pluginDef',
    'copy:imgToDist',
    'copy:leaflet',

    'copy:highcharts',
    'copy:turf',
    'copy:leafletAwesomeMarkers',
    'copy:leafletMarkerCluster',
    'copy:leafletSleep',

    //    'postcss',
    'babel'
  ]);
};
