import { type Server } from 'node:http';

import chalk from 'chalk';
import { createLogger, type InlineConfig, mergeConfig, type PluginOption, preview as startPreview, type PreviewServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';

import clientInject from './middleware/client-inject.js';
import clientRoute from './middleware/client-route.js';
import error from './middleware/error.js';
import ping from './middleware/ping.js';

export interface BuildPreviewConfig extends Pick<InlineConfig, 'plugins'> {
  reload?: boolean;
}

const IS_WATCH_ARG_FOUND = process.argv.includes('--watch') || process.argv.includes('-w');
const WS_PAGE_RELOAD_MESSAGE = JSON.stringify({ type: 'page-reload' });

export default function plugin({ reload = true, ...previewConfig }: BuildPreviewConfig = {}): PluginOption {
  let clearScreen = false;
  let enabled = false;
  let logger = createLogger('silent');
  let base: string;
  let configFile: string | undefined;
  let inlineConfig: InlineConfig;
  let preview: PreviewServer | undefined;
  let ws: WebSocketServer | undefined;
  let buildError: Error | undefined;

  return {
    name: 'preview',
    apply: 'build',

    async configResolved(config) {
      if (IS_WATCH_ARG_FOUND || config.build.watch) {
        enabled = true;
        logger = config.logger;
        base = config.base;
        configFile = config.configFile;
        inlineConfig = config.inlineConfig;
      }

      clearScreen = config.clearScreen ?? true;

      Object.assign(config, {
        clearScreen: undefined,
        build: {
          ...config.build,
          // XXX: Removing output files while previewing can lead to errors
          // when serving files that are temporarily missing. Possibly, a
          // manual cleanup could be added to this plugin in the `closeBundle`
          // hook, to remove files that were not generated in the last build,
          // as long as the last build was successful.
          emptyOutDir: false,
        },
      });
    },

    async buildStart() {
      if (!enabled) return;

      if (clearScreen) {
        logger.clearScreen('error');
      }
    },

    async buildEnd(error) {
      if (!enabled) return;

      buildError = error;
    },

    async closeBundle() {
      if (!enabled) return;

      if (preview) {
        if (ws) {
          for (const client of ws.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(WS_PAGE_RELOAD_MESSAGE);
            }
          }
        }

        return;
      }

      let restartCount = 0;

      async function start(): Promise<void> {
        const isRestart = Boolean(preview);

        if (isRestart) {
          ++restartCount;

          if (clearScreen) {
            logger.clearScreen('error');
          }

          logger.info('server restarted.' + (restartCount >= 2 ? chalk.yellow(` (x${restartCount})`) : ''), { timestamp: true });
        }

        preview = await startPreview(mergeConfig<InlineConfig, InlineConfig>({
          ...inlineConfig,
          configFile,
          plugins: [
            {
              name: 'preview',
              apply: 'serve',
              configurePreviewServer({ middlewares }) {
                middlewares.use(ping());
                middlewares.use(clientRoute({ base }));
                if (reload) {
                  middlewares.use(clientInject({ base }));
                }
                middlewares.use(error({ getError: () => buildError }));
              },
            },
          ],
        }, previewConfig));

        if (!isRestart) {
          console.log();
          preview.printUrls();
        }

        preview.bindCLIShortcuts({
          print: !isRestart,
          customShortcuts: [
            { key: 'r', description: 'restart the server', action: async () => {
              await preview?.close();
              await start();
            } },
            { key: 'u', description: 'show server url', action: () => {
              console.log();
              preview?.printUrls();
            } },
            { key: 'c', description: 'clear console', action: () => {
              logger.clearScreen('error');
            } },
          ],
        });

        if (reload) {
          ws = new WebSocketServer({ server: preview.httpServer as Server });

          ws.on('connection', (client) => {
            client.on('message', (event) => {
              try {
                const message = JSON.parse(String(event as unknown));

                if (message.type === 'reconnect') {
                  client.send(WS_PAGE_RELOAD_MESSAGE);
                }
              }
              catch {
                // ignored
              }
            });
          });
        }
      }

      await start();
    },
  };
}
