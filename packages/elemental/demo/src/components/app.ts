import { Component, defineComponent, h } from '../../../src/index';
import STYLE from './app.css?inline';
import icon from './icon.ts';

class AppComponent extends Component {
  static readonly tag = 'ce-app';

  protected override render(shadow: ShadowRoot): void {
    const todoItemsContainer = h('div');
    const input = h('input', { name: 'my-input' });
    const checkbox = h('input', { type: 'checkbox', name: 'my-checkbox', ':checked': false });

    h(shadow, [
      h('style', [STYLE]),
      h('div', { id: 'app' }, [
        h('h1', ['Todo List']),
        h(icon, { name: 'tabler' }),
        h('span', ['testing...']),
        input,
        checkbox,
        todoItemsContainer,
      ]),
    ]);
  }
}

export default defineComponent(AppComponent);
