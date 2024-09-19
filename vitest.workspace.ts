import fs from 'node:fs';

export default [
  ...fs.readdirSync('packages', { withFileTypes: true }),
  ...fs.readdirSync('templates', { withFileTypes: true }),
]
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => `${dirent.parentPath}/${dirent.name}`)
  .filter((path) => {
    const files = fs.readdirSync(path, { withFileTypes: true, recursive: true })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => `${dirent.parentPath}/${dirent.name}`);

    return (
      files.some((file) => /\bvitest\.config(?:\..*)?\.ts$/.test(file))
      && files.some((file) => file.endsWith('.spec.ts'))
    );
  });
