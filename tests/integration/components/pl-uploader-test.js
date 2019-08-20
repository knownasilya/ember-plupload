import { reject, resolve } from 'rsvp';
import { get } from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { addFiles } from 'ember-plupload/test-helper';
import hbs from 'htmlbars-inline-precompile';

module('pl-uploader', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.uploaderService = this.owner.lookup('service:uploader');
  });

  test('addFiles test helper integration', async function(assert) {
    let file;
    this.set('uploadIt', (file) => {
      file.upload();
    })
    this.set('onInit', (pl, queue) => {
      [file] = addFiles(queue, {
        name: 'Cat Eating Watermelon.png',
        size: 2048
      });
    })

    await render(hbs`
      <PlUploader
        @name='uploader'
        @onfileadd={{action uploadIt}}
        @onInitOfUploader={{action onInit}}
        @for='upload-image'
      as |queue|>
        <div id="file-count">{{queue.length}}</div>
        <div id="file-progress">{{queue.progress}}</div>
        <div id="upload-image">Upload Image</div>
      </PlUploader>
    `);

    assert.dom('#file-count').hasText('1', 'Should have 1 file');
    assert.dom('#file-progress').hasText('0', 'Progress is 0');

    file.progress = 80;
    assert.dom('#file-progress').hasText('80', 'Progress should have updated to 80');

    file.respondWith(200, { 'Content-Type': 'application/json' }, {});
    assert.dom('#file-count').hasText('0', 'Should have 0 files after');
  });

  test('errors with read()', async function(assert) {
    this.setProperties({
      makeItError(file) {
        file.read().catch((error) => {
          this.set('error', error);
        });
      },
      onInit(pl, queue) {
        addFiles(queue, {
          name: 'Cat Eating Watermelon.png',
          size: 2048,
          dataURL: reject('really nasty error')
        });
      }
    });

    await render(hbs`
      <div class='error'>{{error}}</div>

      <PlUploader
        @name='uploader'
        @onInitOfUploader={{action this.onInit}}
        @onfileadd={{action this.makeItError}}
        @for='upload-image'
      >
        <div id='upload-image'>Upload Image</div>
      </PlUploader>
    `);

    assert.dom('.error').hasText('really nasty error');
  });

  test('it works with read()', async function(assert) {
    this.setProperties({
      makeItWork(file) {
        file.read().then( (url) => {
          this.set('cat', url);
        });
      },
      onInit(pl, queue) {
        addFiles(queue, {
          name: 'Cat Eating Watermelon.png',
          size: 2048,
          dataURL: resolve('data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=')
        });
      }
    });

    await render(hbs`
      <PlUploader
        @name='uploader'
        @for='upload-image'
        @onInitOfUploader={{action this.onInit}}
        @onfileadd={{action this.makeItWork}}
      >
        <div id='upload-image'>Upload Image</div>
      </PlUploader>

      <img src='{{cat}}' />
    `);

    assert.dom('img').hasAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=');
  });

  test('no source is provided', async function(assert) {
    this.setProperties({
      makeItWork(file) {
        assert.throws(() => {
          file.read({ as: 'text' });
        }, /Cat Eating Watermelon.*text/);
      },
      onInit(pl, queue) {
        addFiles(queue, {
          name: 'Cat Eating Watermelon.png',
          size: 2048
        });
      }
    });

    await render(hbs`
      <PlUploader
        @name='uploader'
        @for='upload-image'
        @onInitOfUploader={{action this.onInit}}
        @onfileadd={{action this.makeItWork}}
      >
        <div id='upload-image'>Upload Image</div>
      </PlUploader>
    `);
  });

  test('configures the plupload Uploader correctly', async function(assert) {
    let settings = {
      url: true,
      runtimes: 'html5,html4,flash,silverlight',
      browse_button: ['browse-button'],
      container: 'test',
      flash_swf_url: '/assets/Moxie.swf',
      silverlight_xap_url: '/assets/Moxie.xap',
      http_method: 'POST',
      max_retries: 0,
      multipart: true,
      required_features: {
        select_file: true
      },
      resize: false,
      unique_names: false,
      multi_selection: true,
      send_file_name: true,
      send_chunk_number: true,
      file_data_name: 'file',
      chunk_size: 0,
      filters: {
        mime_types: [{
          extensions: 'jpg,png,gif'
        }],
        max_file_size: 256,
        prevent_duplicates: true,
        prevent_empty: true
      }
    };

    this.setProperties({
      uploadIt() {},
      onInit(pl, queue, comp) {
        settings.container = this.element.children[0];
        if (get(comp, 'dropzone.enabled')) {
          settings.drop_element = ['dropzone-for-test'];
        }
        assert.deepEqual(pl.settings, settings);
      }
    });

    await render(hbs`
      <PlUploader
        @elementId='test'
        @name='uploader'
        @for='browse-button'
        @extensions='JPG PNG GIF'
        @max-file-size={{256}}
        @no-duplicates={{true}}
        @send-file-name={{true}}
        @onInitOfUploader={{action this.onInit}}
        @onfileadd={{action this.uploadIt}}
      />
    `);
  });

  test('when html5 is not a runtime, drop_element is not included', async function(assert) {
    let settings = {
      url: true,
      runtimes: 'html4,flash',
      browse_button: ['browse-button'],
      container: 'test',
      flash_swf_url: '/assets/Moxie.swf',
      silverlight_xap_url: '/assets/Moxie.xap',
      http_method: 'POST',
      max_retries: 0,
      multipart: true,
      required_features: {
        select_file: true
      },
      resize: false,
      unique_names: false,
      multi_selection: true,
      send_file_name: false,
      send_chunk_number: true,
      file_data_name: 'file',
      chunk_size: 0,
      filters: {
        mime_types: [{
          extensions: 'jpg,png,gif'
        }],
        max_file_size: 256,
        prevent_duplicates: true,
        prevent_empty: true
      }
    };

    this.setProperties({
      uploadIt() {},
      onInit(pl) {
        settings.container = this.element.children[0];
        assert.deepEqual(pl.settings, settings);
      }
    });

    await render(hbs`
      <PlUploader
        @elementId='test'
        @name='uploader'
        @for='browse-button'
        @extensions='JPG PNG GIF'
        @runtimes='html4 flash'
        @max-file-size={{256}}
        @no-duplicates={{true}}
        @send-file-name={{false}}
        @onInitOfUploader={{action this.onInit}}
        @onfileadd={{action this.uploadIt}}
      />
    `);
  });

  test('sends an event when the file is queued', async function (assert) {

    this.setProperties({
      onInit(pl, queue) {
        addFiles(queue, {
          name: 'Cat Eating Watermelon.png',
          size: 2048,
          id: 'test-file',
          progress: 0
        });
      },
      uploadImage(file, env) {
        assert.equal(get(file, 'id'), 'test-file');
        assert.equal(get(file, 'name'), 'Cat Eating Watermelon.png');
        assert.equal(get(file, 'size'), 2048);
        assert.equal(get(file, 'progress'), 0);
        assert.equal(env.name, 'uploader');
        // TODO: Don't really know how to test this
        // assert.equal(env.uploader, uploader);
        assert.ok(!env.uploader.started);
      }
    });

    await render(hbs`
      <PlUploader
        @name='uploader'
        @for='upload-image'
        @onInitOfUploader={{action this.onInit}}
        @onfileadd={{action this.uploadImage}}
      >
        <div id='upload-image'>Upload Image</div>
      </PlUploader>
    `);
  });

});
