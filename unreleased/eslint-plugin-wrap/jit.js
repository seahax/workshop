import { tsImport } from 'tsx/esm/api';

const { default: plugin } = await tsImport('./src/index.ts', import.meta.url);

export default plugin;
