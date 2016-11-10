var _ = require('lodash'),
    gulp = require('gulp'),
    inject = require('gulp-inject'),
    path = require('path'),
    rename = require('gulp-rename'),
    runSequence = require('run-sequence'),
    stylus = require('gulp-stylus'),
    util = require('gulp-util'),
    watch = require('gulp-watch');

var injectOptions = {
  addPrefix: '{{ site.baseurl }}',
  addRootSlash: false
};

gulp.task('inject-css', function() {

  var css = gulp.src(stylesheets, { read: false });

  return gulp
    .src('_includes/head.html')
    .pipe(inject(css, injectOptions))
    .pipe(gulp.dest('_includes'));
});

gulp.task('inject-js', function() {

  var js = gulp.src(javascripts, { read: false });

  return gulp
    .src('_includes/footer.html')
    .pipe(inject(js, injectOptions))
    .pipe(gulp.dest('_includes'));
});

gulp.task('stylus', compileStylus);

gulp.task('watch-stylus', function() {
  watch('_stylus/**/*.styl', function(file) {

    var sequence = [ 'stylus' ];
    if (file.event == 'add' || file.event == 'unlink') {
      sequence.push('inject-css');
    }

    runSequence(sequence);
  });
});

gulp.task('libs', function() {

  var files = _.map(libAssets, 'src');

  gulp
    .src(files, { base: '.' })
    .pipe(rename(function(filePath) {

      var asset = _.find(libAssets, { src: path.join(filePath.dirname, filePath.basename) + filePath.extname });

      filePath.dirname = path.dirname(asset.dest);
      filePath.basename = path.basename(asset.dest, path.extname(asset.dest));
      filePath.extname = path.extname(asset.dest);

      util.log(util.colors.cyan(asset.src) + ' -> ' + util.colors.cyan(path.join('libs', asset.dest)));

      return filePath;
    }))
    .pipe(gulp.dest('libs'));
});

gulp.task('dev', [ 'stylus', 'inject-css', 'inject-js', 'watch-stylus' ]);

function compileStylus() {
  gulp
    .src('_stylus/*.styl')
    .pipe(stylus({
      'include css': true
    }))
    .pipe(gulp.dest('css'));
}

var stylesheets = [
  'libs/unsemantic.css',
  'css/*.css'
];

var javascripts = [
  'libs/lodash.js',
  'libs/js.cookie.js',
  'libs/jquery.js',
  'libs/jquery.smooth-scroll.js',
  'libs/shuffle.js',
  'libs/vimeo.js',
  'js/*.js'
];

var libAssets = [
  // Stylesheets
  { src: 'node_modules/unsemantic/assets/stylesheets/unsemantic-grid-responsive-tablet.css', dest: 'unsemantic.css' },
  // Javascripts
  { src: 'node_modules/lodash/lodash.js', dest: 'lodash.js' },
  { src: 'node_modules/jquery/dist/jquery.js', dest: 'jquery.js' },
  { src: 'node_modules/jquery-smooth-scroll/jquery.smooth-scroll.js', dest: 'jquery.smooth-scroll.js' },
  { src: 'node_modules/shufflejs/dist/shuffle.js', dest: 'shuffle.js' },
  { src: 'node_modules/js-cookie/src/js.cookie.js', dest: 'js.cookie.js' },
  { src: 'node_modules/@vimeo/player/dist/player.min.js', dest: 'vimeo.js' }
];
