type TagMap = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap;
type TagType<TTag extends string> = TTag extends keyof TagMap ? TagMap[TTag] : HTMLElement;
type ChildValue = Node | HtmlKeyNode | string | number | bigint | false | null | undefined;
type AttrValue = string | number | bigint | boolean | null | undefined;

export interface HtmlKeyNode<TTag extends keyof TagMap | (string & {}) = string> {
  readonly tag: TTag;
  readonly key: string;
  readonly attrs: Readonly<Record<string, AttrValue>>;
  readonly children: readonly ChildValue[] | undefined;
  toElement: () => TagType<TTag>;
}

const DATA_KEY = 'data-key';

/**
 * Create an HTML element with attributes and children.
 */
export function html<const TTag extends keyof TagMap | (string & {})>(
  tag: TTag | CustomElementConstructor,
  attrs: { readonly $key: string } & Readonly<Record<string, AttrValue>>,
  children?: readonly ChildValue[],
): HtmlKeyNode<TTag>;

/**
 * Create an HTML element with attributes and children.
 */
export function html<const TTag extends keyof TagMap | (string & {})>(
  tag: TTag | CustomElementConstructor,
  attrs?: Readonly<Record<string, AttrValue>>,
  children?: readonly ChildValue[],
): TagType<TTag>;

/**
 * Create an HTML element with children.
 */
export function html<const TTag extends keyof TagMap | (string & {})>(
  tag: TTag | CustomElementConstructor,
  children?: readonly ChildValue[],
): TagType<TTag>;

/**
 * Update element attributes and replace children.
 */
export function html<TElement extends Element | Document | ShadowRoot>(
  element: TElement,
  attrs?: TElement extends { setAttribute: (...args: any[]) => any } ? Readonly<Record<string, AttrValue>> : undefined,
  children?: readonly ChildValue[],
): TElement;

/**
 * Replace element children.
 */
export function html<TElement extends Element | Document | ShadowRoot>(
  element: TElement,
  children?: readonly ChildValue[],
): TElement;

export function html(
  el: string | CustomElementConstructor | Element | Document | ShadowRoot,
  attrsOrChildren: Readonly<Record<string, AttrValue>> | readonly ChildValue[] = {},
  children: readonly ChildValue[] = [],
): Node | HtmlKeyNode {
  if (typeof el === 'function') {
    let name = customElements.getName(el);

    if (name == null) {
      name = `ce-${crypto.randomUUID()}`;
      customElements.define(name, el);
    }

    el = name;
  }

  let attrs: Readonly<Record<string, AttrValue>>;
  [attrs, children] = Array.isArray(attrsOrChildren)
    ? [{}, attrsOrChildren as readonly ChildValue[]]
    : [attrsOrChildren as Readonly<Record<string, AttrValue>>, children];

  if (typeof el === 'string') {
    const { [DATA_KEY]: key, ...otherAttrs } = attrs;

    return typeof key === 'string'
      ? {
          tag: el,
          key,
          attrs: otherAttrs,
          children,
          toElement: () => html(document.createElement(el), otherAttrs, children),
        }
      : html(document.createElement(el), attrs, children);
  }

  if ('setAttribute' in el) {
    const oldAttrs = new Set(el.getAttributeNames());

    for (const [name, rawValue] of Object.entries(attrs)) {
      oldAttrs?.delete(name);
      if (rawValue == null || rawValue == false) continue;
      const value = rawValue == true ? '' : String(rawValue);
      if (el.getAttribute(name) === value) continue;
      el.setAttribute(name, value);
    }

    for (const name of oldAttrs) {
      el.removeAttribute(name);
    }
  }

  let keyElements: Map<string, Element> | undefined;

  el.replaceChildren(
    ...children
      .filter((child) => child != null && child !== false)
      .map((child) => {
        if (typeof child !== 'object') return document.createTextNode(String(child));
        if (child instanceof Node) return child;

        keyElements ??= new Map(
          [...el.children].flatMap((child) => {
            const key = child.getAttribute(DATA_KEY);
            return key == null ? [] : [[key, child] as const];
          }),
        );

        const reused = keyElements.get(child.key);

        if (reused) {
          keyElements.delete(child.key);
          return html(reused, child.attrs, child.children);
        }

        return child.toElement();
      }),
  );

  return el;
}

/** Parse a raw HTML string into a `DocumentFragment`. */
export function parseHTML(htmlString: string): DocumentFragment {
  const template = html('template');
  template.innerHTML = htmlString;
  return template.content;
}
