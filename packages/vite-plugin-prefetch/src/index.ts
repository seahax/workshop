import path from 'node:path';

import type { Plugin } from 'vite';

export interface PrefetchPluginOptions {
  readonly delayMilliseconds?: number;
}

export default function plugin({
  delayMilliseconds: prefetchDelayMilliseconds = 200,
}: PrefetchPluginOptions = {}): Plugin {
  return {
    name: 'prefetch',
    generateBundle(this, _options, bundle) {
      for (const entry of Object.values(bundle)) {
        if (entry.type !== 'chunk') continue;
        if (!entry.isEntry) continue;
        if (entry.dynamicImports.length <= 0) continue;

        const dynamicImports = Array.from(new Set(entry.dynamicImports.map((filename) => {
          return './' + path.posix.relative(path.posix.dirname(entry.fileName), filename);
        })));

        const prefetchCode = `
          ;setTimeout(()=>
            ${JSON.stringify(dynamicImports)}.forEach((v)=>import(v).catch(()=>{}))
          ,${JSON.stringify(prefetchDelayMilliseconds)});
        `.trim().replaceAll(/\r?\n\s*/gu, '');
        console.log(prefetchCode);

        const match = entry.code.match(/^\/\/# *sourceMappingURL/mu);

        entry.code = match?.index
          ? entry.code.slice(0, match.index) + prefetchCode + '\n' + entry.code.slice(match.index)
          : entry.code = `${entry.code}\n${prefetchCode}`;
      }
    },
  };
}
