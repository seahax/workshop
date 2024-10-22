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
  readonly extraFiles?: Record<string, string>;
}

export default function plugin({ root, include = ['**'], exclude = [], outFile, extraFiles = {} }: ZipOptions = {}): Plugin {
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
        // const input = glob.stream([...include], {
        //   cwd,
        //   ignore: [...exclude, glob.escapePath(path.relative(cwd, absOutFile).replaceAll('\\', '/'))],
        //   dot: true,
        //   unique: true,
        //   onlyFiles: false,
        // });
        const output = outputHandle.createWriteStream();
        const zip = archiver('zip', { zlib: { level: 9 } });

        zip.pipe(output);
        zip.on('entry', (entry) => {
          logger.info(`  added: ${entry.name}`);
        });

        const promise = new Promise<void>((resolve, reject) => {
          zip.on('close', () => resolve());
          zip.on('error', (error) => reject(error));
        });

        for (const input of include) {
          console.log(cwd, input);
          zip.glob(input, {
            cwd,
            ignore: [...exclude, path.relative(cwd, absOutFile).replaceAll('\\', '/')],
            dot: true,
            nodir: false,
          });
        }

        // for await (const entry of input) {
        //   const name = entry.toString('utf8');
        //   const source = path.resolve(cwd, name);
        //   const stat = await fs.stat(name);

        //   if (stat.isDirectory()) {
        //     logger.info(`  directory: ${name}`);
        //     zip.directory(source, name);
        //   }
        //   else {
        //     logger.info(`  file: ${name}`);
        //     zip.file(source, { name: name });
        //   }
        // }

        for (const [name, source] of Object.entries(extraFiles)) {
          logger.info(`  extra: ${name}`);
          zip.append(source, { name });
        }

        await zip.finalize();

        return promise;
      });
    },
  };
}
