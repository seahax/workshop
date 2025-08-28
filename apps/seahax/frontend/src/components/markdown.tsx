import { Box, type BoxProps, styled } from '@mui/material';
import Marked, { type ReactRenderer } from 'marked-react';
import React, { type JSX } from 'react';
import { useMemo } from 'react';

interface MarkdownProps extends Omit<BoxProps, 'children'> {
  readonly value: string;
  readonly jsx: Readonly<Record<string, React.ComponentType<any>>>;
  readonly renderer?: Partial<ReactRenderer>;
}

const MarkdownContainer = styled(Box, {
  name: 'MarkdownContainer',
  slot: 'root',
})();

export function Markdown({ value, jsx, renderer: customRenderer, ...containerProps }: MarkdownProps): JSX.Element {
  const renderer = useMemo<Partial<ReactRenderer>>(() => ({
    ...customRenderer,
    html: (html) => {
      if (typeof html === 'string' && html.startsWith('<jsx-')) {
        const el = Object.assign(document.createElement('template'), { innerHTML: `<${html.slice(5)}` });
        const child = el.content.firstElementChild;

        if (!child) return html;

        const key = child.tagName.toLowerCase().replaceAll(/(?:^|-)([a-z])/gu, (_, value) => value.toUpperCase());
        const component = jsx[key];

        if (!component) return html;

        const entries = child.getAttributeNames().map((name) => [name, child.getAttribute(name) ?? ''] as const);
        const props = Object.fromEntries(entries);
        const content = React.createElement(component, props);

        return content;
      }

      return customRenderer?.html ? customRenderer.html(html) : html;
    },
  }), [jsx, customRenderer]);

  return (
    <MarkdownContainer {...containerProps}>
      <Marked value={value} renderer={renderer} />
    </MarkdownContainer>
  );
}
