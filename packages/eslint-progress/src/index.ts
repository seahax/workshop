import path from 'node:path';

import type eslint from 'eslint';

export default function progress(): eslint.Linter.Config {
  return {
    plugins: {
      progress: {
        rules: {
          progress: {
            create(context) {
              console.log(`eslint: ${path.relative(context.cwd, context.filename)}`);
              return {};
            },
          },
        },
      },
    },
    rules: {
      'progress/progress': 1,
    },
  };
}
