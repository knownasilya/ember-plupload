import Controller from '@ember/controller';
import { A } from "@ember/array"

export default Controller.extend({
  events: null,
  actions: {
    uploadImage(file) {
      if (this.events == null) {
        this.set('events', A([]));
      }

      let filename = file.name;
      file.read().then((url) => {
        this.events.pushObject({
          filename: filename,
          preview: url
        });
      }, function () {});

      file.destroy();
    }
  }
});
