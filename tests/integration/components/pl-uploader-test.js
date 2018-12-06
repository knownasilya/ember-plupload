import { reject, resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import { addFiles } from 'ember-plupload/test-helper';
import hbs from 'htmlbars-inline-precompile';

module('pl-uploader', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('addFiles test helper integration', async function(assert) {
    this.actions.uploadIt = (file) => {
      file.upload();
    };

    await render(hbs`
      {{#pl-uploader name='uploader' onfileadd='uploadIt' for='upload-image' as |queue|}}
        <div id="file-count">{{queue.length}}</div>
        <div id="file-progress">{{queue.progress}}</div>
        <div id="upload-image">Upload Image</div>
      {{/pl-uploader}}
    `);

    let file = addFiles(this.container, 'uploader', {
      name: 'Cat Eating Watermelon.png',
      size: 2048
    })[0];

    assert.equal(find('#file-count').textContent, '1');

    assert.equal(find('#file-progress').textContent, '0');
    file.progress = 80;
    assert.equal(find('#file-progress').textContent, '80');

    file.respondWith(200, { 'Content-Type': 'application/json' }, {});
    assert.equal(find('#file-count').textContent, '0');
  });

  test('errors with read()', async function(assert) {
    this.actions.makeItError = (file) => {
      file.read().catch((error) => {
        this.set('error', error);
      });
    };

    await render(hbs`
      <div class='error'>{{error}}</div>
      {{#pl-uploader name='uploader' onfileadd='makeItError' for='upload-image' as |queue|}}
        <div id="upload-image">Upload Image</div>
      {{/pl-uploader}}
    `);

    addFiles(this.container, 'uploader', {
      name: 'Cat Eating Watermelon.png',
      size: 2048,
      dataURL: reject('really nasty error')
    });

    assert.equal(find('.error').textContent, 'really nasty error');
  });

  test('it works with read()', async function(assert) {
    this.actions.makeItWork = (file) => {
      file.read().then( (url) => {
        this.set('cat', url);
      });
    };

    await render(hbs`
      {{#pl-uploader name='uploader' onfileadd='makeItWork' for='upload-image' as |queue|}}
        <div id="upload-image">Upload Image</div>
      {{/pl-uploader}}
      <img src='{{cat}}' />
    `);

    addFiles(this.container, 'uploader', {
      name: 'Cat Eating Watermelon.png',
      size: 2048,
      dataURL: resolve('data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=')
    });

    assert.equal(find('img').getAttribute('src'), 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=');
  });

  test('no source is provided', async function(assert) {
    this.actions.makeItWork = function(file) {
      assert.throws( function() {
        file.read({ as: 'text' });
      }, /Cat Eating Watermelon.*text/);
    };

    await render(hbs`
      {{#pl-uploader name='uploader' onfileadd='makeItWork' for='upload-image' as |queue|}}
        <div id="upload-image">Upload Image</div>
      {{/pl-uploader}}
    `);

    addFiles(this.container, 'uploader', {
      name: 'Cat Eating Watermelon.png',
      size: 2048
    });
  });
});
