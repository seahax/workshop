// import { randomUUID } from 'node:crypto';
// import fs from 'node:fs/promises';
// import os from 'node:os';

// import mongoose, { type Mongoose } from 'mongoose';

// import { config } from '../config.ts';

// export async function initDbAuth(): Promise<Mongoose> {
//   const tlsCAFile = await initTlsCaFile();
//   const client = await mongoose.connect(config.authDbUrl, tlsCAFile
//     ? { tls: true, tlsCAFile }
//     : {});

//   return client;
// }

// async function initTlsCaFile(): Promise<string | undefined> {
//   if (!config.authDbCaCert) return;

//   const tmpDir = os.tmpdir();
//   const tlsCaFile = `${tmpDir}/ca-cert.${randomUUID()}.pem`;

//   await fs.writeFile(tlsCaFile, config.authDbCaCert, 'utf8');

//   return tlsCaFile;
// }
export {};
