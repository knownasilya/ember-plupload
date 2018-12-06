import Route from '@ember/routing/route';

export default Route.extend({
  model: function () {
    return {
      title: 'Blërg',
      post: {
        title: 'In the kitchen'
      }
    };
  }
});
