declare module '*.mdx' {
  const value: (props: { readonly components?: {} | undefined }) => JSX.Element;
  export default value;
}
