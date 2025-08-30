# @seahax/vite-plugin-prefetch

Vite plugin that injects dynamic import prefetching into each chunk.

Appends a small snippet of code to the end of each entry chunk. The snippet prefetches all of the chunk's dynamic imports by calling `import(dynamicImportPath)` early, but with a short delay to prevent blocking resources that are critical for initial rendering. When the real dynamic import is used, it is handled by the module cache.

The injected snippet looks like this:

```js
setTimeout(()=>["./index-BpbxaBtl.js"].forEach((v)=>import(v).catch(()=>{})),200);
```

This has the following benefits:

1. Reduces site latency when using lazy-loaded modules.
2. Avoids 404 responses when an app has been redeployed causing the old chunks to be unavailable, but the client still has an entry script loaded that references the old chunks.

Turning off Vite's `build.modulePreload` option is recommended when using this plugin. The capabilities mostly overlap, but Vite doesn't include all dynamic imports in a chunk (only the "immediate" ones?). Vite injects `<link rel="modulepreload" href="..." />` elements which don't have consistent behavior across browsers, and the polyfill that Vite injects uses fetch instead of import.
