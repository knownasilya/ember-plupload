import EmberObject from '@ember/object';
import UploadQueue from 'ember-plupload/system/upload-queue';
import File from 'ember-plupload/system/file';
import {
  module,
  test
} from 'qunit';

module('File', function() {
  test("#upload - it will only call its uploader's start method when all queued files have been setup (settings are set on all files)", function(assert) {
    assert.expect(3);
    let uploadCalls = 0;
    const TestableFile = File.extend({
      upload() {
        uploadCalls++;
        return this._super(...arguments);
      }
    });

    const uploader = EmberObject.extend({
      start() {
        assert.equal(uploadCalls, 2, 'Uploader was only started after both files were setup');
      }
    }).create();

    const fileToUpload1 = {id: 1};
    const fileToUpload2 = {id: 2};
    const queue = UploadQueue.create();
    const file1 = TestableFile.create({uploader, queue, file: fileToUpload1});
    const file2 = TestableFile.create({uploader, queue, file: fileToUpload2});

    queue.pushObject(file1);
    queue.pushObject(file2);

    file2.upload('www.example.com');
    assert.equal(uploadCalls, 1, 'first file called #upload');
    file1.upload('www.example.com');
    assert.equal(uploadCalls, 2, 'second file called #upload');
  });
});
