import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setupRenderingTest } from 'ember-qunit';
import {
  module,
  test
} from 'qunit';
import { addFiles } from 'ember-plupload/test-helper';
import { A } from '@ember/array';

module('service:uploader', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.sut = this.owner.lookup('service:uploader');
  });

  test('the size of the uploader is the aggregate of all queues', async function (assert) {

    this.set('files', A());
    this.set('uploadIt', () => {});

    await render(hbs`
      <PlUploader
        @name='uploader1'
        @onfileadd={{action uploadIt}}
        @for='upload-image1'
        as |queue|
      >
        <div id="file-count1">{{queue.length}}</div>
        <div id="file-progress1">{{queue.progress}}</div>
        <div id="upload-image1">Upload Image</div>
      </PlUploader>

      <PlUploader
        @name='uploader2'
        @onfileadd={{action uploadIt}}
        @for='upload-image2'
        as |queue|
      >
        <div id="file-count2">{{queue.length}}</div>
        <div id="file-progress2">{{queue.progress}}</div>
        <div id="upload-image2">Upload Image</div>
      </PlUploader>
    `);


    assert.equal(this.sut.files.length, 0, 'Queue should be empty');
    assert.equal(this.sut.size, 0, 'File size should be 0');
    assert.equal(this.sut.loaded, 0, 'Should have 0 loaded files');
    assert.equal(this.sut.progress, 0, 'Progress should be zero');

    addFiles(this.sut.queues.get('uploader1'), {
      name: 'test-filename.jpg',
      size: 2000,
      percent: 0
    });

    assert.equal(this.sut.files.length, 1, 'Should have 1 file');
    assert.equal(this.sut.size, 2000, 'Filesize should be 2000');
    assert.equal(this.sut.loaded, 0, 'Should have 0 loaded files');
    assert.equal(this.sut.progress, 0, 'Progress should be 0');

    addFiles(this.sut.queues.get('uploader2'), {
      name: 'test-filename.jpg',
      size: 3500,
      percent: 0
    });

    assert.equal(this.sut.files.length, 2, 'Should have 2 file');
    assert.equal(this.sut.size, 5500, 'Filesize should be 5500');
    assert.equal(this.sut.loaded, 0, 'Loaded should be 0');
    assert.equal(this.sut.progress, 0, 'Progress should still be 0');

    addFiles(this.sut.queues.get('uploader2'), {
      name: 'test-filename.jpg',
      size: 1400,
      percent: 0
    });

    assert.equal(this.sut.files.length, 3, 'Should have 3 file');
    assert.equal(this.sut.size, 6900, 'Filesize should be 6900');
    assert.equal(this.sut.loaded, 0, 'Loaded should be 0');
    assert.equal(this.sut.progress, 0, 'Progress should still be 0');

  });

  test('the uploaded size of the uploader is the aggregate of all queues', async function (assert) {

    this.set('files', A());
    this.set('uploadIt', () => { });

    await render(hbs`
      <PlUploader
        @name='uploader1'
        @onfileadd={{action uploadIt}}
        @for='upload-image1'
        as |queue|
      >
        <div id="file-count1">{{queue.length}}</div>
        <div id="file-progress1">{{queue.progress}}</div>
        <div id="upload-image1">Upload Image</div>
      </PlUploader>

      <PlUploader
        @name='uploader2'
        @onfileadd={{action uploadIt}}
        @for='upload-image2'
        as |queue|
      >
        <div id="file-count2">{{queue.length}}</div>
        <div id="file-progress2">{{queue.progress}}</div>
        <div id="upload-image2">Upload Image</div>
      </PlUploader>
    `);

    assert.equal(this.sut.files.length, 0, 'Queue should be empty');
    assert.equal(this.sut.size, 0, 'File size should be 0');
    assert.equal(this.sut.loaded, 0, 'Should have 0 loaded files');
    assert.equal(this.sut.progress, 0, 'Progress should be zero');

    addFiles(this.sut.queues.get('uploader1'), {
      name: 'test-filename.jpg',
      size: 2000,
      loaded: 500
    });

    assert.equal(this.sut.files.length, 1, 'Queue should have 1 file');
    assert.equal(this.sut.size, 2000, 'File size should be 2000');
    // assert.equal(this.sut.loaded, 500);
    // assert.equal(this.sut.progress, 25, 'Progress should be 25');

    addFiles(this.sut.queues.get('uploader2'), {
      name: 'test-filename.jpg',
      size: 3500,
      loaded: 500
    });

    assert.equal(this.sut.files.length, 2, 'Queue should have 2 file');
    assert.equal(this.sut.size, 5500, 'File size should be 5500');
    // assert.equal(this.sut.loaded, 1000);
    // assert.equal(this.sut.progress, 18, 'Progress should be 18');

    addFiles(this.sut.queues.get('uploader2'), {
      name: 'test-filename.jpg',
      size: 1400,
      loaded: 1000
    });

    assert.equal(this.sut.files.length, 3, 'Queue should have 2 file');
    assert.equal(this.sut.size, 6900, 'File size should be 5500');
    // assert.equal(this.sut.loaded, 2000);
    // assert.equal(this.sut.progress, 28, 'Progress should be 28');
  });
});
