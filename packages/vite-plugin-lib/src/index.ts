import chmodx from '@seahax/vite-plugin-chmodx';
import external, { type ExternalOptions } from '@seahax/vite-plugin-external';
import finalize from '@seahax/vite-plugin-finalize';
import { type LibraryFormats, mergeConfig, type PluginOption, type UserConfig } from 'vite';

export interface LibOptions extends ExternalOptions {
  readonly tscCommand?: string | false;
  readonly tscArgs?: readonly string[];
  readonly bundle?: boolean | { external?: boolean };
}

export default function plugin({
  packageJsonPath,
  tscCommand = 'tsc',
  tscArgs = ['-b', '--force'],
  bundle = false,
}: LibOptions = {}): PluginOption {
  const useExternal = bundle === false || (typeof bundle === 'object' && bundle.external !== true);

  return [
    useExternal && external({ packageJsonPath }),
    chmodx(),
    finalize(async ($) => {
      if (tscCommand) await $(tscCommand, tscArgs);
    }),
    {
      name: 'lib',
      config(config) {
        const formats: undefined | LibraryFormats | LibraryFormats[] = config.build?.lib && config.build.lib.formats
          ? undefined
          : ['es'];

        const target = config.build?.target
          ? (Array.isArray(config.build.target)
              ? config.build.target
              : [config.build.target])
          : ['es2022'];

        const conditions = target.length > 0 && target.every((t) => /^node/iu.test(t))
          ? ['node']
          : undefined;

        return mergeConfig<UserConfig, UserConfig>({
          build: {
            target,
            lib: {
              entry: 'src/index.ts',
              formats,
              fileName: '[name]',
            },
            sourcemap: true,
            rollupOptions: {
              output: {
                preserveModules: !bundle,
              },
            },
          },
          resolve: {
            conditions,
          },
        }, config);
      },
    },
  ];
}
