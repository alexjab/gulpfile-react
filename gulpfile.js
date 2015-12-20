const path = require('path');

const source = require('vinyl-source-stream');
const gulp = require('gulp');
const gutil = require('gulp-util');
const browserify = require('browserify');
const reactify = require('reactify');
const babelify = require('babelify');
const watchify = require('watchify');
const notify = require('gulp-notify');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const gulpIf = require('gulp-if');

const srcDir = './src/';
const dstDir = './lib/';
const srcFile = 'App.react.js';
const dstFile = 'app.js';

const isProduction = process.env.NODE_ENV === 'production';

function handleErrors() {
  const args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

function buildScript(file, watch) {
  
  const props = {
    entries: [path.join(srcDir, file)],
    debug : !isProduction,
    transform: [
      [ babelify, { presets: ['es2015', 'react'] } ]
    ],
    cache: {},
    packageCache: {},
    fullPaths: true
  };

  const bundler = watch ? watchify(browserify(props)) : browserify(props);

  function rebundle() {
    const stream = bundler.bundle();
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      .pipe(gulpIf(isProduction, buffer()))
      .pipe(gulpIf(isProduction, uglify()))
      .pipe(gulp.dest(dstDir));
  }

  // listen for an update and run rebundle
  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });

  // run it once the first time buildScript is called
  return rebundle();
}


// Run once.
gulp.task('build', function() {
  return buildScript(srcFile, false);
});

// Watch source file.
// To watch in `production` mode,
// you need to run `gulp watch` explicitely.
gulp.task('watch', function() {
  return buildScript(srcFile, true);
});

// If this is production, just build.
// If not, build and then watch.
// To build in production mode, and then watch,
// just run `gulp watch` explicitely.
gulp.task('default', ['build'], function() {
  if (isProduction) return;
  return buildScript(srcFile, true);
});

