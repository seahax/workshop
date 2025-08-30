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
})({
  '& > :first-child': {
    marginBlockStart: 0,
  },
  '& > :last-child': {
    marginBlockEnd: 0,
  },
});

export default function Markdown({
  value,
  jsx,
  renderer: customRenderer,
  ...containerProps
}: MarkdownProps): JSX.Element {
  const renderer = useMemo<Partial<ReactRenderer>>(() => ({
    ...customRenderer,
    html: (html) => {
      if (typeof html === 'string') {
        const el = Object.assign(document.createElement('template'), { innerHTML: html });
        const child = el.content.firstElementChild;

        if (!child) return html;

        const component = (
          jsx[child.tagName.toLowerCase()]
          ?? jsx[getSnakeCase(child.tagName)]
          ?? jsx[getPascalCase(child.tagName)]
        );

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

function getPascalCase(value: string): string {
  return value.toLowerCase().replaceAll(/(?:^|-+)([a-z])/gu, (_, value) => value.toUpperCase());
}

function getSnakeCase(value: string): string {
  return value.toLowerCase().replaceAll(/-+([a-z])/gu, (_, value) => value.toUpperCase());
}
