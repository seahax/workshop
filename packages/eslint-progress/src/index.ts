import path from 'node:path';

import type eslint from 'eslint';

export default function progress(): eslint.Linter.FlatConfig {
  return {
    plugins: {
      progress: {
        rules: {
          progress: {
            create(context) {
              console.log(`lint: ${path.relative(context.cwd, context.filename)}`);
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
