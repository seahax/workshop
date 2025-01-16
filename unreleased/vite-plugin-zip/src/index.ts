import fs from 'node:fs/promises';
import path from 'node:path';

import archiver from 'archiver';
import { createLogger, type Plugin } from 'vite';

export interface ZipOptions {
  /**
   * Root directory of all files to be zipped. Defaults to the Vite config
   * `build.outDir`.
   */
  readonly root?: string;
  /**
   * Filenames to include. Defaults to `['**']`.
   *
   * **NOTE:** Must match _files_, not directory names.
   */
  readonly include?: readonly string[];
  /**
   * Filenames to exclude. Defaults to `[]`.
   *
   * **NOTE:** Must match _files_, not directory names.
   */
  readonly exclude?: readonly string[];
  /**
   * Output zip file path. Defaults to `bundle.zip`.
   */
  readonly outFile?: string;
  /**
   * Extra files to include in the zip. The key is the path inside the zip and
   * the value is the file content.
   */
  readonly extraFiles?: Record<string, string>;
  /**
   * Print added files to the console. Defaults to `false`.
   */
  readonly verbose?: boolean;
}

export default function plugin({
  root,
  include = ['**'],
  exclude = [],
  outFile,
  extraFiles = {},
  verbose = false,
}: ZipOptions = {}): Plugin {
  let configRoot = process.cwd();
  let outDir = path.resolve(configRoot, 'dist');

  return {
    name: 'zip',
    configResolved(config) {
      configRoot = config.root;
      outDir = config.build.outDir;
      console.log(outDir);
    },
    async closeBundle() {
      const logger = createLogger();
      const cwd = path.resolve(configRoot, root ?? outDir);
      const absOutFile = path.resolve(configRoot, outDir, outFile ?? 'bundle.zip');

      logger.info(`creating zip "${path.relative(configRoot, absOutFile)}" (root: "${path.relative(configRoot, cwd)}")`);

      await fs.mkdir(path.dirname(absOutFile), { recursive: true });
      await fs.open(absOutFile, 'w').then(async (outputHandle) => {
        const output = outputHandle.createWriteStream();
        const zip = archiver('zip', { zlib: { level: 9 } });

        zip.pipe(output);
        if (verbose) zip.on('entry', (entry) => logger.info(`  added: ${entry.name}`));

        const promise = new Promise<void>((resolve, reject) => {
          zip.on('close', () => resolve());
          zip.on('error', (error) => reject(error));
        });

        for (const input of include) {
          zip.glob(input, {
            cwd,
            ignore: [...exclude, path.relative(cwd, absOutFile).replaceAll('\\', '/')],
            dot: true,
            nodir: true,
          });
        }

        for (const [name, source] of Object.entries(extraFiles)) {
          if (verbose) logger.info(`  extra: ${name}`);
          zip.append(source, { name });
        }

        await zip.finalize();

        return promise;
      });
    },
  };
}
