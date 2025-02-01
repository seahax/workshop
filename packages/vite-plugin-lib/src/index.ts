import chmodx from '@seahax/vite-plugin-chmodx';
import external, { type ExternalOptions } from '@seahax/vite-plugin-external';
import { type LibraryFormats, type LibraryOptions, mergeConfig, type PluginOption, type UserConfig } from 'vite';

export interface LibOptions extends ExternalOptions {
  readonly bundle?: boolean;
  readonly minify?: boolean;
}

export default function plugin({
  bundle = false,
  minify = bundle,
  packageJsonPath = !bundle,
}: LibOptions = {}): PluginOption {
  return [
    external({ packageJsonPath }),
    chmodx(),
    {
      name: 'lib',
      config(config) {
        const targetOverride = config.build?.target
          ? (Array.isArray(config.build.target)
              ? config.build.target
              : [config.build.target])
          : ['es2022'];

        const entryOverride = typeof config.build?.lib === 'object'
          ? config.build.lib.entry
          : 'src/index.ts';

        const formatsOverride:
          | undefined
          | LibraryFormats
          | LibraryFormats[] = config.build?.lib && config.build.lib.formats
            ? undefined
            : ['es'];

        const isNodeTarget = targetOverride.length > 0 && targetOverride.every((t) => /^node/iu.test(t));

        config = mergeConfig<UserConfig, UserConfig>({
          build: {
            lib: {
              entry: 'src/index.ts',
              fileName: (format, entryName) => {
                if (format === 'es') return `${entryName}.mjs`;
                if (format === 'cjs') return `${entryName}.cjs`;
                return `${entryName}.${format}.js`;
              },
            },
            minify,
            sourcemap: true,
            rollupOptions: {
              output: {
                preserveModules: !bundle,
              },
              treeshake: bundle,
            },
          },
          resolve: {
            // Node libs should use the node export condition.
            conditions: isNodeTarget ? ['node'] : undefined,
            // Node libs should ignore the package browser field.
            mainFields: [...(isNodeTarget ? [] : ['browser']), 'module', 'jsnext:main', 'jsnext'],
          },
        }, config);

        config.build!.target = targetOverride;
        (config.build!.lib as LibraryOptions).entry = entryOverride;
        (config.build!.lib as LibraryOptions).formats = formatsOverride;

        return config;
      },
    },
  ];
}
