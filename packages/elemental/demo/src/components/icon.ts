import tabler from '@tabler/icons/outline/brand-tabler.svg?raw';
import mail from '@tabler/icons/outline/mail.svg?raw';
import STYLE_NORMAL from 'normalize.css/normalize.css?inline';

import { defineComponent, h, parseHTML, useAttributes, useEffect, useRef } from '../../../src/index';
import STYLE from './icon.css?inline';

const ICONS: ReadonlyMap<string, string> = new Map(
  Object.entries({
    mail,
    tabler,
  }),
);

export const Icon = defineComponent((shadow) => {
  const attrs = useAttributes('name', 'stroke-width');
  const svg = useRef<SVGSVGElement | null>(null);

  // prettier-ignore
  h(shadow, [
    h('style', [STYLE_NORMAL]),
    h('style', [STYLE]),
  ]);

  useEffect([attrs.name], (name) => {
    if (name == null) {
      svg.value = null;
      return;
    }

    const newSvg = parseHTML(ICONS.get(name) ?? '<svg><!-- unknown icon name --></svg>').childNodes[0] as SVGSVGElement;
    newSvg.removeAttribute('class');
    svg.value = newSvg;
  });

  useEffect([svg, attrs['stroke-width']], (svg, strokeWidth) => {
    svg?.setAttribute('stroke-width', strokeWidth ?? '1.75px');
  });

  useEffect([svg], (svg) => {
    if (!svg) return;
    shadow.append(svg);
    return () => svg.remove();
  });
});
