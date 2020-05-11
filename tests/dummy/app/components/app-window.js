import { A } from '@ember/array';
import jQuery from 'jquery';
import { scheduleOnce, bind, next } from '@ember/runloop';
import { on } from '@ember/object/evented';
import Component from '@ember/component';
import { htmlSafe } from '@ember/template';
import { get, set, computed, observer } from '@ember/object';
import PageTitleList from 'ember-page-title/services/page-title-list';

export default Component.extend({
  classNames: ['window', 'app'],
  layoutName: 'components/window',

  tokenList: computed(function () {
    return PageTitleList.create();
  }),

  title: computed(function () {
    let tokens = get(this, 'tokenList.sortedTokens');
    let title = [];
    for (let i = 0, len = tokens.length; i < len; i++) {
      let token = tokens[i];
      let styles = token.active ? ' active' : '';
      title.push(`<span class="title-token${styles}" id="title-${token.id}">${token.title}</span>`);
      if (i + 1 < len) {
        title.push(token.separator);
      }
    }
    return htmlSafe(title.join(''));
  }),

  titleDidChange: on('didInsertElement', function () {
    scheduleOnce('afterRender', () => {
      this.notifyPropertyChange('title');
    });
  }),

  updateStyles: observer('tokenList.tokens.@each.active', function () {
    get(this, 'tokenList.tokens').forEach((token) => {
      let $el = jQuery(`#title-${token.id}`);
      if (!$el) { return; }
      if (token.active) {
        $el.addClass('active');
      } else {
        $el.removeClass('active');
      }
    });
  }),

  didInsertElement() {
    this._activate = bind(this, this.activate);
    next(() => {
      jQuery(this.element).on('click', '.title-token', this._activate);
    });
  },

  willDestroyElement() {
    jQuery(this.element).off('click', '.title-token', this._activate);
  },

  activate(evt) {
    let tokenId = $(evt.target).attr('id').split('-')[1];
    let tokens = get(this, 'tokenList.tokens');
    let components = get(this, 'tokenList.tokens').getEach('component');

    let token = tokens.findBy('id', tokenId);
    let active = !get(token, 'active');

    tokens.setEach('active', false);
    A(components).setEach('active', false);

    set(token, 'component.active', active);
    set(token, 'active', active);
  }

});
