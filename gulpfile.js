var gulp = require('gulp');
var rimraf = require('rimraf');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var footer = require('gulp-footer');
var merge = require('merge2');
var fs = require('fs');

var tsProject = ts.createProject({
	target: 'ES5',
	module: 'commonjs',
	noExternalResolve: true,
	declaration: true
});
var tsLintConfig = require('./tslint.json');

gulp.task('default', ['lint', 'scripts']);

gulp.task('clean', function(cb) {
	rimraf('release', cb);
});

gulp.task('lint', function() {
	return gulp.src(['lib/**/*.ts', '!lib/definitions/**/*.ts'])
		.pipe(tslint({
			configuration: tsLintConfig,
			tslint: require('tslint')
		}))
		.pipe(tslint.report('verbose'));
});

gulp.task('scripts', ['clean'], function() {
	var tsRes = gulp.src('lib/**/*.ts')
		.pipe(sourcemaps.init())
		.pipe(ts(tsProject));
	return merge(
		tsRes.dts.pipe(gulp.dest('release')),
		tsRes.js
			.pipe(sourcemaps.write('.'))
			.pipe(gulp.dest('release'))
	);
});

gulp.task('watch', function() {
	gulp.watch('lib/**', ['default']);
});
