import STYLE_NORMAL from 'normalize.css/normalize.css?inline';

import { defineComponent, h } from '../../../src/index';
import STYLE from './app.css?inline';
import { Icon } from './icon.ts';

export const App = defineComponent<{ foo: boolean }>(
  (shadow, props) => {
    const todoItemsContainer = h('div');
    const input = h('input', { name: 'my-input' });
    const checkbox = h('input', {
      type: 'checkbox',
      name: 'my-checkbox',
      checked: true,
    });

    void props.foo;

    h(shadow, [
      h('style', [STYLE_NORMAL]),
      h('style', [STYLE]),
      h('div', { id: 'app' }, [
        h('h1', ['Todo List']),
        h(Icon, { name: 'tabler' }),
        h('span', ['testing...']),
        input,
        checkbox,
        todoItemsContainer,
      ]),
    ]);
  },
  {
    props: {
      foo: (ref, host) => ({
        get: () => ref.value ?? host.hasAttribute('foo'),
        set: (value) => (ref.value = value),
      }),
    },
  },
);
