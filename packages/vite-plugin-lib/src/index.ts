import chmodx from '@seahax/vite-plugin-chmodx';
import external, { type ExternalOptions } from '@seahax/vite-plugin-external';
import finalize from '@seahax/vite-plugin-finalize';
import { mergeConfig, type PluginOption } from 'vite';

export interface LibOptions extends ExternalOptions {
  readonly tscCommand?: string | false;
  readonly tscArgs?: readonly string[];
}

export default function plugin({
  packageJsonPath,
  tscCommand = 'tsc',
  tscArgs = ['-b', '--force'],
}: LibOptions = {}): PluginOption {
  return [
    external({ packageJsonPath }),
    chmodx(),
    finalize(async ($) => {
      if (tscCommand) await $(tscCommand, tscArgs);
    }),
    {
      name: 'lib',
      config(config) {
        const formats = config.build?.lib && config.build.lib.formats
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

        return mergeConfig({
          target,
          build: {
            lib: {
              entry: 'src/index.ts',
              formats,
            },
            sourcemap: true,
            rollupOptions: {
              output: {
                preserveModules: true,
                entryFileNames: '[name].js',
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
