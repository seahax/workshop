import tabler from '@tabler/icons/outline/brand-tabler.svg?raw';
import mail from '@tabler/icons/outline/mail.svg?raw';

import { Component, defineComponent, h, useAttributes, useEffect, useRef } from '../../../src/index';
import STYLE from './icon.css?inline';

class IconComponent extends Component {
  static readonly tag = 'ce-icon';

  protected override render(shadow: ShadowRoot): void {
    h(shadow, [
      h('style', [STYLE]),
    ]);

    const attrs = useAttributes('name', 'stroke-width');
    const svg = useRef<SVGSVGElement | undefined>(undefined);

    useEffect([attrs.name], (name) => {
      const el = svg.value = name == null ? undefined : getSvg(name);
      if (el) shadow.append(el);
      return () => el?.remove();
    });

    useEffect([svg, attrs['stroke-width']], (svg, strokeWidth) => {
      h(svg, { 'stroke-width': strokeWidth ?? '1.75px' });
    });
  }
}

export default defineComponent(IconComponent);

const icons: ReadonlyMap<string, string> = new Map(Object.entries({
  mail,
  tabler,
}));

function getSvg(name: string): SVGSVGElement {
  const div = h('div');
  div.innerHTML = icons.get(name) ?? '<svg><!-- unknown icon name --></svg>';
  return h(div.firstChild as SVGSVGElement, { class: null });
}
