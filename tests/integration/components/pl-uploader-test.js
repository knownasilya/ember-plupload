import { reject, resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import { addFiles } from 'ember-plupload/test-helper';
import hbs from 'htmlbars-inline-precompile';

module('pl-uploader', function(hooks) {
  setupRenderingTest(hooks);

  test('addFiles test helper integration', async function(assert) {
    let file;

    this.setProperties({
      uploadIt(file)  {
        file.upload();
      },
      onInit(pl, queue) {
        [file] = addFiles(queue, {
          name: 'Cat Eating Watermelon.png',
          size: 2048
        });
      }
    });

    await render(hbs`
      <PlUploader
        @name='uploader'
        @onfileadd={{action this.uploadIt}}
        @onInitOfUploader={{action this.onInit}}
        @for='upload-image'
      as |queue|>
        <div id="file-count">{{queue.length}}</div>
        <div id="file-progress">{{queue.progress}}</div>
        <div id="upload-image">Upload Image</div>
      </PlUploader>
    `);

    assert.dom('#file-count').hasText('1');
    assert.dom('#file-progress').hasText('0');

    file.progress = 80;
    assert.dom('#file-progress').hasText('80');

    file.respondWith(200, { 'Content-Type': 'application/json' }, {});
    assert.dom('#file-count').hasText('0');
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
});
