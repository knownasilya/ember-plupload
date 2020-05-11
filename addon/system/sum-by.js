import { A } from '@ember/array';
import { get } from '@ember/object';

export default function (target, key) {
  return A(target).reduce(function (E, obj) {
    return E + get(obj, key);
  }, 0);
}
