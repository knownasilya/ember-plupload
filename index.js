/* jshint node: true */
'use strict';

const Funnel = require('broccoli-funnel');
const Merge = require('broccoli-merge-trees');
const path = require('path');
const existsSync = require('exists-sync');
const fastbootTransform = require('fastboot-transform');

module.exports = {
  name: 'ember-plupload',

  included: function (app) {
    this._super.included(app);
    var config = this.app.project.config(app.env) || {};
    var addonConfig = config[this.name] || {};
    var debugMode = addonConfig.debug;

    if (debugMode === undefined) {
      debugMode = process.env.EMBER_ENV === 'development';
    }


    if (debugMode) {
      app.import('vendor/plupload/moxie.js');
      app.import('vendor/plupload/plupload.dev.js');
    } else {
      app.import('vendor/plupload/plupload.full.min.js');
    }

    app.import('bower_components/plupload/js/Moxie.swf', {
      destDir: 'assets'
    });
    app.import('bower_components/plupload/js/Moxie.xap', {
      destDir: 'assets'
    });
    app.import('bower_components/dinosheets/dist/dinosheets.amd.js', {
      exports: {
        'dinosheets': ['default']
      }
    });

    app.import('vendor/styles/ember-plupload.css');
  },

  treeForVendor(tree) {
    let trees = [];

    if (tree) {
      trees.push(tree);
    }

    const app = this._findHost();
    let assetDir = path.join(this.project.root, app.bowerDirectory, 'plupload', 'js');

    if (existsSync(assetDir)) {
      const browserTrees = fastbootTransform(new Funnel(assetDir, {
        files: ['moxie.js', 'plupload.dev.js', 'plupload.full.min.js'],
        destDir: 'plupload'
      }));
      trees.push(browserTrees);
    }

    return new Merge(trees);
  }
};
