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

      turf: {
        cwd: 'node_modules/turf',
        expand: true,
        src: ['**/*'],
        dest: 'dist/vendor/turf'
      },

      osmbuildings: {
        cwd: 'node_modules/osmbuildings/dist/',
        expand: true,
        src: ['**/*'],
        dest: 'dist/vendor/osmbuildings'
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

      fontawesome: {
        cwd: 'node_modules/@fortawesome/fontawesome-free/',
        expand: true,
        src: ['css/*.css','webfonts/*'],
        dest: 'dist/vendor/fontawesome-free'
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
    'copy:turf',
    'copy:osmbuildings',
    'copy:leafletAwesomeMarkers',
    'copy:leafletMarkerCluster',
    'copy:leafletSleep',
    'copy:fontawesome',

    //    'postcss',
    'babel'
  ]);
};
