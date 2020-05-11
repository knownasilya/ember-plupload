import { helper as buildHelper } from '@ember/component/helper';

export default buildHelper(function (params) {
  return params.join('');
});

