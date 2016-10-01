/*
 * slush-onepop-webapp
 * https://github.com/onepopcorn/slush-onepop-webapp
 *
 * Copyright (c) 2016, @onepopcorn
 * Licensed under the MIT license.
 */

'use strict';

var gulp = require('gulp'),
    install = require('gulp-install'),
    conflict = require('gulp-conflict'),
    template = require('gulp-template'),
    rename = require('gulp-rename'),
    _ = require('underscore.string'),
    inquirer = require('inquirer'),
    path = require('path');

function format(string) {
    var username = string.toLowerCase();
    return username.replace(/\s/g, '');
}

var defaults = (function () {
    var workingDirName = _.camelize(path.basename(process.cwd())),
      homeDir, osUserName, configFile, user;

    if (process.platform === 'win32') {
        homeDir = process.env.USERPROFILE;
        osUserName = process.env.USERNAME || path.basename(homeDir).toLowerCase();
    }
    else {
        homeDir = process.env.HOME || process.env.HOMEPATH;
        osUserName = homeDir && homeDir.split('/').pop() || 'root';
    }

    configFile = path.join(homeDir, '.gitconfig');
    user = {};

    if (require('fs').existsSync(configFile)) {
        user = require('iniparser').parseSync(configFile).user;
    }

    return {
        appName: workingDirName,
        repoURL:  "https://github.com/" + (format(user.name || '') || osUserName ) + "/" + workingDirName + ".git",
        authorName: user.name || '',
        authorEmail: user.email || '',
        licenseType: 'MIT',
        isPrivate: false,
    };
})();

gulp.task('default', function (done) {
    var prompts = [{
        name: 'appName',
        message: 'What is the name of your project?',
        default: defaults.appName
    }, {
        name: 'appDescription',
        message: 'What is the description?'
    }, {
        name: 'appVersion',
        message: 'What is the version of your project?',
        default: '0.1.0',
        validate: function(input) {

            return /^[0-9]+\.[0-9]+\.[0-9]+$/.test(input);
        }
    }, {
        name: 'authorName',
        message: 'What is the author name?',
        default: defaults.authorName
    }, {
        name: 'authorEmail',
        message: 'What is the author email?',
        default: defaults.authorEmail
    }, {
        name: 'appRepository',
        message: 'What is the git repository url?',
        default: defaults.repoURL
    }, {
        name: 'isPrivate',
        message: 'Is this package private? If public you must use a SPDX license identifier',
        default: defaults.isPrivate

    }, {
        when: function(answers){
            return !answers.isPrivate
        },
        name: 'licenseType',
        message: 'Choose a licencse. Remember to change package.json if you choose \'Other\'',
        // default: defaults.licenseType,
        type: 'list',
        choices: ['MIT', 'BSD-3-Clause','GPL-3.0','LGPL-3.0','ISC','UNLICENSED','Other']

    }, { 
        when: function(answers){
            return answers.isPrivate
        },
        name: 'licenseType',
        message: 'What type of license'
    }, {
        type: 'confirm',
        name: 'moveon',
        message: 'Continue?'
    }];
    //Ask
    inquirer.prompt(prompts,
        function (answers) {
            if (!answers.moveon) {
                return done();
            }
            answers.appNameSlug = _.camelize(answers.appName);
            gulp.src(__dirname + '/templates/**')
                .pipe(template(answers))
                .pipe(rename(function (file) {
                    if (file.basename[0] === '_') {
                        file.basename = '.' + file.basename.slice(1);
                    }
                }))
                .pipe(conflict('./'))
                .pipe(gulp.dest('./'))
                .pipe(install())
                .on('end', function () {
                    done();
                });
        });
});
