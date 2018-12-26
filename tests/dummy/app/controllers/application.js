import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    uploadImage(file) {
      if (this.get('events') == null) {
        this.set('events', A([]));
      }

      let filename = file.get('name');
      file.read().then(function (url) {
        this.get('events').pushObject({
          filename: filename,
          preview: url
        });
      }, function () {});

      file.destroy();
    }
  }
});
