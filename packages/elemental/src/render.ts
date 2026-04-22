type TagMap = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap;
type ChildValue = Node | string | number | bigint | false | null | undefined;
type AttrValue = string | number | bigint | false | null | undefined;

/** Create an HTML element with attributes and children. */
export function render<const TTag extends keyof TagMap | (string & {})>(
  tag: TTag | { readonly tag: TTag },
  attrs?: Readonly<Record<string, AttrValue>>,
  children?: readonly ChildValue[],
): TTag extends keyof TagMap ? TagMap[TTag] : HTMLElement;
/** Create an HTML element with children. */
export function render<const TTag extends keyof TagMap | (string & {})>(
  tag: TTag | { readonly tag: TTag },
  children?: readonly ChildValue[],
): TTag extends keyof TagMap ? TagMap[TTag] : HTMLElement;
/** Update element attributes and replace children. */
export function render<TElement extends Element | ParentNode | void>(
  element: TElement,
  attrs?: TElement extends { setAttribute: (...args: any[]) => any } ? Readonly<Record<string, AttrValue>> : undefined,
  children?: readonly ChildValue[],
): TElement;
/** Replace element children. */
export function render<TElement extends Element | ParentNode | void>(
  element: TElement,
  children?: readonly ChildValue[],
): TElement;
export function render(
  tagOrElement: string | { readonly tag: string } | Element | (ParentNode & { _?: unknown }),
  attrsOrChildren: Readonly<Record<string, AttrValue>> | readonly ChildValue[] = {},
  children?: readonly ChildValue[],
): Node {
  let el: Element | (ParentNode & { _?: unknown });

  if (typeof tagOrElement === 'string') el = document.createElement(tagOrElement);
  else if ('tag' in tagOrElement) el = document.createElement(tagOrElement.tag);
  else el = tagOrElement;

  let attrs: Readonly<Record<string, AttrValue>>;
  [attrs, children] = Array.isArray(attrsOrChildren)
    ? [{}, attrsOrChildren as readonly ChildValue[]]
    : [attrsOrChildren as Readonly<Record<string, AttrValue>>, children];

  if ('setAttribute' in el) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === undefined) continue;
      if (value === null || value === false) el.removeAttribute(name);
      else el.setAttribute(name, String(value));
    }
  }

  if (children) {
    el.replaceChildren(
      ...children
        .filter((child) => child != null && child !== false)
        .map((child) => typeof child === 'object' ? child : document.createTextNode(String(child))),
    );
  }

  return el;
}
