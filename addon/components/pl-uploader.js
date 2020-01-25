import Ember from 'ember';
import trim from '../system/trim';
import w from '../computed/w';

var get = Ember.get;
var set = Ember.set;
var keys = Object.keys;

var bind = Ember.run.bind;
var computed = Ember.computed;

var isDragAndDropSupported = (function () {
  var supported = null;
  return function (runtimes) {
    if (runtimes.indexOf('html5') === -1) {
      return false;
    }

    if (supported == null) {
      supported = 'draggable' in document.createElement('span');
    }
    return supported;
  };
}());

var slice = Array.prototype.slice;

export default Ember.Component.extend({
  classNames: ['pl-uploader'],

  name: null,

  'for-dropzone': null,

  onfileadd: null,
  onerror: null,

  uploader: Ember.inject.service(),

  /**
    A cascading list of runtimes to fallback on to
    for uploading files with.

    @property runtimes
    @type String[]
    @default ['html5', 'html4', 'flash', 'silverlight']
   */
  runtimes: w(['html5', 'html4', 'flash', 'silverlight']),
  extensions: w(),

  'max-file-size': 0,
  'no-duplicates': false,

  multiple: true,
  'unique-names': false,
  'send-browser-cookies': false,
  'send-file-name': null,

  dropzone: computed('for-dropzone', {
    get() {
      var dropzone = {};
      var id = get(this, 'for-dropzone') || 'dropzone-for-' + get(this, 'elementId');
      dropzone.enabled = false;

      if (isDragAndDropSupported(get(this, 'runtimes'))) {
        dropzone.enabled = true;
        dropzone.id = id;
        dropzone.data = null;
        dropzone['drag-and-drop'] = {
          'dropzone-id': id,
          'drag-data': null
        };
      }
      return dropzone;
    }
  }),

  config: computed({
    get() {
      var config = {
        url: true, // Required to init plupload
        browse_button: get(this, 'for'),
        filters: {
          max_file_size: get(this, 'max-file-size'),
          prevent_duplicates: get(this, 'no-duplicates')
        },

        multi_selection: get(this, 'multiple'),

        runtimes: get(this, 'runtimes').join(','),
        container: get(this, 'elementId'),
        flash_swf_url: this.BASE_URL + 'Moxie.swf',
        silverlight_xap_url: this.BASE_URL + 'Moxie.xap',
        unique_names: get(this, 'unique-names'),
        required_features: {}
      };

      if (get(this, 'send-browser-cookies')) {
        config.required_features.send_browser_cookies = true;
      }

      if (get(this, 'send-file-name') != null) {
        config.send_file_name = get(this, 'send-file-name');
      }

      var filters = get(this, 'fileFilters') || {};
      keys(filters).forEach((filter) => {
        if (get(this, filter)) {
          config.filters[filter] = get(this, filter);
        }
      });

      if (isDragAndDropSupported(get(this, 'runtimes'))) {
        config.drop_element = get(this, 'dropzone.id');
      }

      if (get(this, 'extensions.length')) {
        config.filters.mime_types = [{
          extensions: get(this, 'extensions').map(function (ext) {
            return ext.toLowerCase();
          }).join(',')
        }];
      }

      return config;
    }
  }),

  didInsertElement: Ember.on('didInsertElement', function() {
    Ember.run.scheduleOnce('afterRender', this, 'attachUploader');
    Ember.run.scheduleOnce('afterRender', this, 'setupDragListeners');
  }),

  attachUploader() {
    var uploader = get(this, 'uploader');
    var queue = uploader.findOrCreate(get(this, 'name'), this, get(this, 'config'));
    set(this, 'queue', queue);

    // Send up the pluploader object so the app implementing this component as has access to it
    var pluploader = queue.get('queues.firstObject');
    this.sendAction('onInitOfUploader', pluploader);
    this._dragCounter = 0;
    this._invalidateDragData();
  },

  setupDragListeners() {
    var dropzoneId = get(this, 'dropzone.id');
    if (dropzoneId) {
      var handlers = this.eventHandlers = {
        dragenter: bind(this, 'enteredDropzone'),
        dragleave: bind(this, 'leftDropzone')
      };

      keys(handlers).forEach(function (key) {
        Ember.$(document).on(key, '#' + dropzoneId, handlers[key]);
        Ember.$(document).on(key, '.moxie-shim', handlers[key]);
      });
    }
  },

  detachUploader: Ember.on('willDestroyElement', function () {
    var queue = get(this, 'queue');
    if (queue) {
      queue.orphan();
      set(this, 'queue', null);
    }
  }),

  teardownDragListeners: Ember.on('willDestroyElement', function () {
    var dropzoneId = get(this, 'dropzone.id');
    if (dropzoneId) {
      var handlers = this.eventHandlers;
      keys(handlers).forEach(function (key) {
        Ember.$(document).off(key, '#' + dropzoneId, handlers[key]);
        Ember.$(document).off(key, '.moxie-shim', handlers[key]);
      });
      this.eventHandlers = null;
    }
  }),

  dragData: null,
  enteredDropzone(evt) {
    var e = evt.originalEvent;
    if (e.preventDefault) { e.preventDefault(); }
    if (e.stopPropagation) { e.stopPropagation(); }
    if (this._dragCounter === 0) {
        this.activateDropzone(evt.originalEvent);
    }
    this._dragCounter++;
  },

  leftDropzone(evt) {
    var e = evt.originalEvent;
    if (e.preventDefault) { e.preventDefault(); }
    if (e.stopPropagation) { e.stopPropagation(); }
    this._dragCounter--;
    if (this._dragCounter === 0) {
      this.deactivateDropzone();
    }
  },

  activateDropzone(evt) {
    set(this, 'dragData', get(evt, 'dataTransfer'));
  },

  deactivateDropzone() {
    this._dragCounter = 0;
    set(this, 'dragData', null);
  },

  _invalidateDragData: Ember.observer('queue.length', function () {
    // Looks like someone dropped a file
    const filesAdded = get(this, 'queue.length') > this._queued;
    const filesDropped = get(this, 'queue.length') === this._queued;
    if ((filesAdded || filesDropped) && get(this, 'dragData')) {
      this.deactivateDropzone();
    }
    this._queued = get(this, 'queue.length');
    Ember.run.scheduleOnce('afterRender', this, 'refreshQueue');
  }),

  refreshQueue() {
    var queue = this.get('queue');

    if (queue) {
      queue.refresh();
    }
  },

  setDragDataValidity: Ember.observer('dragData', Ember.on('init', function () {
    if (!isDragAndDropSupported(get(this, 'runtimes'))) { return; }

    var data = get(this, 'dragData');
    var extensions = get(this, 'extensions');
    var isValid = true;

    // Validate
    if (extensions.length) {
      isValid = slice.call(get(data || {}, 'items') || []).every(function (item) {
        var fileType = trim(item.type).toLowerCase();
        return extensions.any(function (ext) {
          return (new RegExp(ext + '$')).test(fileType);
        });
      });
    }

    if (data) {
      set(this, 'dropzone.active', true);
      set(this, 'dropzone.valid', isValid);
    } else {
      set(this, 'dropzone.active', false);
      set(this, 'dropzone.valid', null);
    }
  }))
});
