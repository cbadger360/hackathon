const os = require('os');
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const del = require('del');
const gulpDir = process.cwd();
const gulp = require('gulp');
const prompt = require('gulp-prompt');
const stylelint = require('gulp-stylelint');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const aegean = require('gulp-aegean');
sass.compiler = require('node-sass');
const rename = require('gulp-rename');
const multiDest = require('gulp-multi-dest');
const touch = require('gulp-touch-cmd');
const cleanCSS = require('gulp-clean-css');
const header = require('gulp-header');
const footer = require('gulp-footer');
const configChrome = require('./config/chrome.json');
const configPackage = require('./package.json');
const siteReferenceAsset = ['ReferenceSite', 'Site Root', '_Assets'];
const siteReferenceProject = ['ReferenceSite', 'Project', 'Models'];
const siteReferenceAssetPath = path.join(siteReferenceAsset[0], siteReferenceAsset[1], siteReferenceAsset[2]);
const siteReferenceProjectPath = path.join(siteReferenceProject[0], siteReferenceProject[1], siteReferenceProject[2]);

// Clean Assets
gulp.task('clean', function () {
	var dest = [];
	dest.push(siteReferenceAssetPath.split(path.sep)[0]);
	for (var i = 0; i < configChrome.override.length; i++) {
		dest.push(path.join(configChrome.override[i]));
	}
	var directoryPath = listDirSync(gulpDir);
	var whitelistPath = {
		".git": "Git Repository",
		".vscode": "Visual Studio Code Configuration",
		"config": "QuickStart Configuration",
		"node_modules": "Node Modules",
		"src": "QuickStart Source"
	};
	for (let path of directoryPath) {
		var date = new Date();
		var ts = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
		if (typeof whitelistPath[path] == "string") {
			console.log('[\x1b[2m%s\x1b[0m] Keeping   \x1b[32m%s\x1b[0m', ts, whitelistPath[path]);
		} else {
			console.log('[\x1b[2m%s\x1b[0m] Removing  \x1b[31m%s\x1b[0m', ts, path);
			dest.push(path);
		}
	}
	var directoryFile = listFileSync(gulpDir);
	var whitelistFile = {
		".babelrc": "Babel Configuration",
		".gitignore": "Git Ignore Configuration",
		".gitmodules": "Git Modules Configuration",
		"bitbucket-pipelines.yml": "Bitbucket Pipleline Configuration",
		"gulpfile.js": "Gulp Configuration",
		"package-lock.json": "Node Package Configuration Lock",
		"package.json": "Node Package Configuration",
		"readme.md": "Read Me"
	}
	for (let file of directoryFile) {
		var date = new Date();
		var ts = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
		if (typeof whitelistFile[file] == "string") {
			console.log('[\x1b[2m%s\x1b[0m] Keeping   \x1b[32m%s\x1b[0m', ts, whitelistFile[file]);
		} else {
			console.log('[\x1b[2m%s\x1b[0m] Removing  \x1b[31m%s\x1b[0m', ts, file);
			dest.push(file);
		}
	}
	return del(dest);
});

// Distribute Assets
gulp.task('distribute', function () {
	var dest = [];
	var project = path.join(gulpDir, siteReferenceProjectPath);
	dest.push(siteReferenceAssetPath);
	for (var i = 0; i < configChrome.override.length; i++) {
		dest.push(path.join(configChrome.override[i], configChrome.asset.path));
	}
	if (!fs.existsSync(project)) {
		fs.mkdirSync(project, {
			recursive: true
		});
	}
	return gulp
		.src('src/client/_assets/**/*')
		.pipe(multiDest(dest));
});
gulp.task('distribute:watch', function () {
	return gulp.watch('src/client/_assets/**/*', gulp.series('clean', 'distribute', 'babel', 'sass'));
});

// Stylelint
gulp.task('stylelint', function (cb) {
	return gulp
		.src('src/**/*.scss')
		.pipe(stylelintCommon());
});

// Sass + Styelint (Auto Fix)
gulp.task('sass', function () {
	return gulp
		.src('src/client/css/base.scss')
		.pipe(rename(configChrome.asset.css.file))
		.pipe(sass().on('error', sass.logError))
		.pipe(stylelintCommon(false))
		.pipe(cleanCSS())
		.pipe(header('/* <%= name %> */', {
			name: configPackage.name,
		}))
		.pipe(footer('/* <%= time %> */', {
			time: new Date().toISOString()
		}))
		.pipe(gulp.dest(path.join(siteReferenceAssetPath, configChrome.asset.css.path)))
		.pipe(touch());
});
gulp.task('sass:distribute', function () {
	var dest = [];
	for (var i = 0; i < configChrome.override.length; i++) {
		dest.push(path.join(configChrome.override[i], configChrome.asset.path, configChrome.asset.css.path));
	}
	return gulp
		.src(path.join(siteReferenceAssetPath, configChrome.asset.css.path, configChrome.asset.css.file))
		.pipe(multiDest(dest));
});
gulp.task('sass:watch', function () {
	return gulp.watch('src/**/*.scss', gulp.series('stylelint', 'sass', 'sass:distribute'));
});

// Babel
gulp.task('babel', function () {
	return gulp
		.src('src/client/js/base.js')
		.pipe(aegean())
		.pipe(rename(configChrome.asset.js.file))
		.pipe(
			babel({
				presets: ['@babel/preset-env']
			})
		)
		.pipe(gulp.dest(path.join(siteReferenceAssetPath, configChrome.asset.js.path)))
		.pipe(touch());
});
gulp.task('babel:distribute', function () {
	var dest = [];
	for (var i = 0; i < configChrome.override.length; i++) {
		dest.push(path.join(configChrome.override[i], configChrome.asset.path, configChrome.asset.js.path));
	}
	return gulp
		.src(path.join(siteReferenceAssetPath, configChrome.asset.js.path, configChrome.asset.js.file))
		.pipe(multiDest(dest));
});
gulp.task('babel:watch', function () {
	return gulp.watch('src/**/*.js', gulp.series('babel', 'babel:distribute'));
});

// Build
gulp.task('build', gulp.series('clean', 'distribute', 'babel', 'babel:distribute', 'stylelint', 'sass', 'sass:distribute'));

// Default
gulp.task('default', gulp.series('clean', 'distribute', 'babel', 'babel:distribute', 'stylelint', 'sass', 'sass:distribute', gulp.parallel('distribute:watch', 'babel:watch', 'sass:watch')));

// Walk Directory Helper
const walkSync = (dir, list = []) => {
	fs.readdirSync(dir).forEach(file => {
		list = fs.statSync(path.join(dir, file)).isDirectory() ? walkSync(path.join(dir, file), list) : list.concat(path.join(dir, file));
	});
	return list;
}

// List Directory Helper
const listDirSync = (dir, list = []) => {
	fs.readdirSync(dir).forEach(file => {
		if (fs.statSync(path.join(dir, file)).isDirectory()) {
			list.push(file);
		}
	});
	return list;
}

// List File Helper
const listFileSync = (dir, list = []) => {
	fs.readdirSync(dir).forEach(file => {
		if (!fs.statSync(path.join(dir, file)).isDirectory()) {
			list.push(file);
		}
	});
	return list;
}

// Stylelint Common Configuration
function stylelintCommon(bolConsole = true) {
	return stylelint({
		config: {
			plugins: ['stylelint-a11y', 'stylelint-scss', 'stylelint-selector-no-empty', 'stylelint-order'],
			extends: ['stylelint-config-standard', 'stylelint-a11y/recommended'],
			rules: {
				'selector-combinator-space-before': 'never',
				'no-descending-specificity': null,
				'color-named': 'never',
				'color-hex-case': 'lower',
				'declaration-block-no-duplicate-properties': true,
				'font-weight-notation': 'numeric',
				'indentation': 'tab',
				'max-nesting-depth': [7, {
					'ignore': ['blockless-at-rules', 'pseudo-classes']
				}],
				'no-missing-end-of-source-newline': null,
				'number-leading-zero': null,
				'order/order': [
					"custom-properties",
					"declarations"
				],
				'order/properties-alphabetical-order': true,
				'plugin/stylelint-selector-no-empty': true,
				'scss/dollar-variable-default': true,
				'scss/no-duplicate-dollar-variables': true,
				'shorthand-property-no-redundant-values': true,
				'value-keyword-case': 'lower',
				'value-no-vendor-prefix': true,
				'at-rule-no-unknown': null,
				"scss/at-rule-no-unknown": true
			}
		},
		fix: true,
		failAfterError: false,
		reportOutputDir: 'reports/lint',
		reporters: [{
			formatter: 'string',
			console: bolConsole
		}]
	})
}