import { A } from '@ember/array';
import { w } from '@ember/string';
import { computed } from '@ember/object';

var toArray = function (value) {
  if (typeof value === 'string') {
    value = w(value);
  }
  return A(value);
};

export default function(defaultValue) {
  defaultValue = defaultValue || [];
  return computed({
    get() {
      return toArray(defaultValue);
    },
    set(key, value) {
      return toArray(value);
    }
  });
}
