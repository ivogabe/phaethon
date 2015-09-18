var gulp = require('gulp');
var rimraf = require('rimraf');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var footer = require('gulp-footer');
var merge = require('merge2');
var dts = require('dts-generator');
var fs = require('fs');

var tsProject = ts.createProject({
	target: 'ES5',
	module: 'commonjs',
	noExternalResolve: true,
	declaration: true
});
var tsLintConfig = require('./tslint.json');

gulp.task('default', ['lint', 'definitions']);

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
		tsRes.dts.pipe(gulp.dest('release/dts')),
		tsRes.js
			.pipe(sourcemaps.write('.'))
			.pipe(gulp.dest('release/js'))
	);
});

gulp.task('definitions', ['scripts'], function(callback) {
	dts.generate({
		name: '___phaethon',
		baseDir: 'release/dts/server',
		files: fs.readdirSync('release/dts/server'),
		out: 'release/dts/server.d.ts'
	});
	callback();
});

gulp.task('watch', function() {
	gulp.watch('lib/**', ['default']);
});
