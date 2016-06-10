var _ = require('lodash'),
    gulp = require('gulp'),
    inject = require('gulp-inject'),
    path = require('path'),
    rename = require('gulp-rename'),
    runSequence = require('run-sequence'),
    stylus = require('gulp-stylus'),
    util = require('gulp-util'),
    watch = require('gulp-watch');

gulp.task('inject-css', function() {

  var css = gulp.src(stylesheets, { read: false });

  return gulp
    .src('_includes/head.html')
    .pipe(inject(css))
    .pipe(gulp.dest('_includes'));
});

gulp.task('inject-js', function() {

  var js = gulp.src(javascripts, { read: false });

  return gulp
    .src('_includes/footer.html')
    .pipe(inject(js))
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

gulp.task('vendor', function() {

  var files = _.map(vendoredAssets, 'src');

  gulp
    .src(files, { base: '.' })
    .pipe(rename(function(filePath) {

      var asset = _.find(vendoredAssets, { src: path.join(filePath.dirname, filePath.basename) + filePath.extname });

      filePath.dirname = path.dirname(asset.dest);
      filePath.basename = path.basename(asset.dest, path.extname(asset.dest));
      filePath.extname = path.extname(asset.dest);

      util.log(util.colors.cyan(asset.src) + ' -> ' + util.colors.cyan(path.join('vendor', asset.dest)));

      return filePath;
    }))
    .pipe(gulp.dest('vendor'));
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
  'vendor/unsemantic.css',
  'css/*.css'
];

var javascripts = [
  'vendor/lodash.js',
  'vendor/jquery.js',
  'vendor/shuffle.js',
  'js/*.js'
];

var vendoredAssets = [
  // Stylesheets
  { src: 'node_modules/unsemantic/assets/stylesheets/unsemantic-grid-responsive-tablet.css', dest: 'unsemantic.css' },
  // Javascripts
  { src: 'node_modules/lodash/lodash.js', dest: 'lodash.js' },
  { src: 'node_modules/jquery/dist/jquery.js', dest: 'jquery.js' },
  { src: 'node_modules/shufflejs/dist/shuffle.js', dest: 'shuffle.js' }
];