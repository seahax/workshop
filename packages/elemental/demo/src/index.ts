import { h } from '../../src/index';
import { App } from './components/app.ts';
import { Icon } from './components/icon.ts';

customElements.define('ce-app', App);
customElements.define('ce-icon', Icon);

// prettier-ignore
h(document.body, [
  h(App),
]);
