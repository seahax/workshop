import fs from 'node:fs/promises';
import path from 'node:path';

import archiver from 'archiver';
import glob from 'fast-glob';
import { createLogger, type Plugin } from 'vite';

export interface ZipOptions {
  readonly root?: string;
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly outFile?: string;
  readonly extraFiles?: Record<string, string>;
}

export default function plugin({ root = '.', include = ['.'], exclude = [], outFile = 'bundle.zip', extraFiles = {} }: ZipOptions = {}): Plugin {
  let configRoot = process.cwd();

  return {
    name: 'zip',
    configResolved(config) {
      configRoot = config.root;
    },
    async closeBundle() {
      const logger = createLogger();
      const cwd = path.resolve(configRoot, root);
      const absOutFile = path.resolve(cwd, outFile);

      logger.info(`creating zip "${path.relative(configRoot, absOutFile)}" (root: "${path.relative(configRoot, cwd)}")`);

      await fs.mkdir(path.dirname(absOutFile), { recursive: true });
      await fs.open(absOutFile, 'w').then(async (outputHandle) => {
        const input = glob.stream([...include], { ignore: [...exclude], cwd, onlyFiles: false, dot: true, unique: true });
        const output = outputHandle.createWriteStream();
        const zip = archiver('zip', { zlib: { level: 9 } });

        zip.pipe(output);

        const promise = new Promise<void>((resolve, reject) => {
          zip.on('close', () => resolve());
          zip.on('error', (error) => reject(error));
        });

        for await (const entry of input) {
          const name = entry.toString('utf8');
          const source = path.resolve(cwd, name);
          const stat = await fs.stat(name);

          if (stat.isDirectory()) {
            logger.info(`  directory: ${name}`);
            zip.directory(source, name);
          }
          else {
            logger.info(`  file: ${name}`);
            zip.file(source, { name: name });
          }
        }

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
