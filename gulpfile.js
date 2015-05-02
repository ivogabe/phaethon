var gulp = require('gulp');
var rimraf = require('rimraf');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var merge = require('merge2');

var tsProject = new ts.createProject({
	target: 'ES6',
    module: 'commonjs',
    noExternalResolve: true,
    sortOutput: true,
    declarationFiles: true
});
var tsLintConfig = require('./tslint.json');

gulp.task('default', ['lint', 'scripts']);

gulp.task('clean', function(cb) {
	rimraf('release', cb);
});

gulp.task('lint', function() {
    return gulp.src(['lib/**/*.ts', '!lib/definitions/**/*.ts'])
        .pipe(tslint({
            configuration: tsLintConfig
        }))
        .pipe(tslint.report('verbose'));
});

gulp.task('scripts', ['clean'], function(callback) {
	var tsRes = gulp.src('lib/**/*.ts')
		.pipe(sourcemaps.init())
		.pipe(ts(tsProject));
    return merge(
        tsRes.js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('release/js')),
        tsRes.dts.pipe(gulp.dest('release/dts'))
    );
});

gulp.task('watch', function() {
	gulp.watch('lib/**', ['default']);
});
