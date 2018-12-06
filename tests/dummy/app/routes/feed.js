import Route from '@ember/routing/route';
import { capitalize } from '@ember/string';

export default Route.extend({
  model: function (params) {
    return {
      name: capitalize(params.name),
      handle: `@${params.name}`
    };
  }
});
