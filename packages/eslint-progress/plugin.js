import path from 'node:path';

/**
 * @type {() => import('eslint').Linter.Config}
 */
export default function progress() {
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
