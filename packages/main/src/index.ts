/* eslint-disable unicorn/no-process-exit */
import sourceMapSupport from 'source-map-support';

sourceMapSupport.install();
process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);

function onError(error: unknown): void {
  if ((error as any)?.name !== 'AbortError') {
    console.error(process.env.DEBUG ? error : String(error));
    process.exitCode ||= 1;
  }

  process.exit();
}
