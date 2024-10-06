import fs from 'node:fs/promises';

export async function readFile(filename: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filename, 'utf8');
  }
  catch (error: any) {
    if (error?.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}
