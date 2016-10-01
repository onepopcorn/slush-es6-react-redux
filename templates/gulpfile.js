"use strict";

/*
 * IMPORT LIBRARIES
 */

var gulp               = require('gulp'),
	babelify           = require('babelify'),
	browserify         = require('browserify'),
	notifier           = require('node-notifier'),
	rename             = require('gulp-rename'),
	sourcemaps         = require('gulp-sourcemaps'),
	gutil              = require('gulp-util'),
	chalk              = require('chalk'),
	source             = require('vinyl-source-stream'),
	buffer             = require('vinyl-buffer'),
	watchify           = require('watchify'),
	merge              = require('utils-merge'),
	sass               = require('gulp-ruby-sass'),
	sync               = require('browser-sync'),
	autoprefixer       = require('gulp-autoprefixer');

/*
 * PATHS CONFIG
 */

var config = {
	react: {
		src:"src/react/Main.jsx",
		watch:"src/react/**/*",
		outputDir:"bin/",
		outputFile:"bundle.js"
	},
	html: {
		src:["src/*.html","src/manifest.json"],
		watch:["src/*.html","src/manifest.json"],
		outputDir:"bin/"
	},
	css: {
		src:"src/scss/style.scss",
		watch:"src/scss/**/*.scss",
		outputDir:"bin"
	},
	assets: {
		src:["src/assets/**/*.{png,gif,jpg,webp,svg,otf,ttf,eot,woff,woff2,ico}"],
		watch:["src/assets/**/*.{png,gif,jpg,webp,svg,otf,ttf,eot,woff,woff2,ico}"],
		outputDir:"bin/assets"
	}
}

/*
 * SERVER CONFIG
 */

var serverOptions = {
	server: {
		baseDir:'./bin',
		index:'index.html'
	},
	open:true,
	browser:'chrome',
	// ghostMode: {
	// 	clicks:true,
	// 	forms:true,
	// 	scroll:true
	// }
}

/*
 * TASKS
 */

function errorReport(err){
	notifier.notify({title:"Build error",message:err.message});
	gutil.log(chalk.red(err.name) + ": " + chalk.blue(err.message));
	this.emit('end');
}

function bundle(bundler){

	bundler
		.bundle()
		.on('error', errorReport)
		.pipe(source('main.jsx'))
		.pipe(buffer())
		.pipe(rename(config.react.outputFile))
		.pipe(sourcemaps.init({loadMaps:true}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(config.react.outputDir))
		.on('end',() => sync.reload(config.react.outputFile))
}

gulp.task('react', () => {
	var args = merge(watchify.args, { debug:true});

	var bundler = browserify(config.react.src, args)
		.plugin(watchify, {ignoreWatch:['**/node_modules/**']})
		.transform(babelify, {presets:['es2015', 'react']});

		bundle(bundler);

		bundler.on('update', () => bundle(bundler));
})

gulp.task('html', () => {
	return gulp.src(config.html.src)
		   .on('error', errorReport)
		   .pipe(gulp.dest(config.html.outputDir))
		   .on('end', () => sync.reload())
})

gulp.task('style', () => {
	return sass(config.css.src,{
			style:"compressed",
			compass:false})
		.on('error', errorReport)
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(gulp.dest(config.css.outputDir))
		.on('end',() => sync.reload('style.css'))
})

gulp.task('assets', () => {
	return gulp.src(config.assets.src)
		   .pipe(gulp.dest(config.assets.outputDir))
})

/*
 * WATCH TASKS
 */

gulp.task('watch',() => {
	gulp.watch(config.html.watch,['html']);
	gulp.watch(config.css.watch,['style']);
	gulp.watch(config.assets.watch,['assets']);
})

/*
 * DEVELOPMENT SERVER
 */

gulp.task('server',() => {
	sync.init(serverOptions);
})

/*
 * MAIN TASK
 */

gulp.task('default',['html','style','assets','watch','react','server'])

