/* jshint node: true */
'use strict';

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

    if (!process.env.EMBER_CLI_FASTBOOT) {
      if (debugMode) {
        app.import('bower_components/plupload/js/moxie.js');
        app.import('bower_components/plupload/js/plupload.dev.js');
      } else {
        app.import('bower_components/plupload/js/plupload.full.min.js');
      }
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
  }
};
