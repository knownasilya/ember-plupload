import jQuery from 'jquery';
import { on } from '@ember/object/evented';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { bind, scheduleOnce } from '@ember/runloop';
import { get, set, computed, observer } from '@ember/object';
import DinoSheet from 'dinosheets';
import trim from '../system/trim';
import w from '../computed/w';

var keys = Object.keys;

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

var styleSheet;
var sharedStyleSheet = function () {
  if (styleSheet == null) {
    styleSheet = new DinoSheet();
  }
  return styleSheet;
};

var slice = Array.prototype.slice;

export default Component.extend({
  classNames: ['pl-uploader'],

  name: null,
  'for-dropzone': null,
  onfileadd: null,
  onerror: null,
  uploader: service(),

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

  didInsertElement() {
    this._super(...arguments);
    scheduleOnce('afterRender', this, 'attachUploader');
    scheduleOnce('afterRender', this, 'setupDragListeners');
  },

  attachUploader() {
    let uploader = get(this, 'uploader');
    let name = get(this, 'name');
    let queue = uploader.findOrCreate(name, this, get(this, 'config'));

    set(this, 'queue', queue);

    // Send up the pluploader object so the app implementing this component has access to it
    let pluploader = queue.get('queues.firstObject');

    if (this.onInitOfUploader) {
      this.onInitOfUploader(pluploader, queue, this);
    }

    this._dragInProgress = false;
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
        jQuery(document).on(key, '#' + dropzoneId, handlers[key]);
      });
    }
  },

  willDestroyElement() {
    this.detachUploader();
    this.teardownDragListeners();
  },

  detachUploader() {
    let queue = get(this, 'queue');

    if (queue) {
      queue.orphan();
      set(this, 'queue', null);
    }

    let sheet = sharedStyleSheet();

    sheet.css(`#${get(this, 'dropzone.id')} *`, null);
    sheet.applyStyles();
  },

  teardownDragListeners() {
    let dropzoneId = get(this, 'dropzone.id');

    if (dropzoneId) {
      let handlers = this.eventHandlers;

      keys(handlers).forEach(function (key) {
        jQuery(document).off(key, '#' + dropzoneId, handlers[key]);
      });
      this.eventHandlers = null;
    }
  },

  dragData: null,
  enteredDropzone({ originalEvent: evt }) {
    if (this._dragInProgress === false) {
      this._dragInProgress = true;
      this.activateDropzone(evt);
    }
  },

  leftDropzone() {
    if (this._dragInProgress === true) {
      this._dragInProgress = false;
      this.deactivateDropzone();
    }
  },

  activateDropzone(evt) {
    let sheet = sharedStyleSheet();

    sheet.css(`#${get(this, 'dropzone.id')} *`, {
      pointerEvents: 'none'
    });

    scheduleOnce('render', sheet, 'applyStyles');
    set(this, 'dragData', get(evt, 'dataTransfer'));
  },

  deactivateDropzone() {
    let sheet = sharedStyleSheet();

    sheet.css(`#${get(this, 'dropzone.id')} *`, null);
    scheduleOnce('render', sheet, 'applyStyles');

    this._dragInProgress = false;
    set(this, 'dragData', null);
  },

  _invalidateDragData: observer('queue.length', function () {
    // Looks like someone dropped a file
    const filesAdded = get(this, 'queue.length') > this._queued;
    const filesDropped = get(this, 'queue.length') === this._queued;

    if ((filesAdded || filesDropped) && get(this, 'dragData')) {
      this.deactivateDropzone();
    }

    this._queued = get(this, 'queue.length');
    scheduleOnce('afterRender', this, 'refreshQueue');
  }),

  refreshQueue() {
    let queue = this.get('queue');

    if (queue) {
      queue.refresh();
    }
  },

  setDragDataValidity: observer('dragData', on('init', function () {
    if (!isDragAndDropSupported(get(this, 'runtimes'))) {
      return;
    }

    let data = get(this, 'dragData');
    let extensions = get(this, 'extensions');
    let isValid = true;

    // Validate
    if (extensions.length) {
      isValid = slice.call(get(data || {}, 'items') || []).every(function (item) {
        let fileType = trim(item.type).toLowerCase();
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
