import { background } from '../services/background.ts';
import { config } from '../services/config.ts';

background(async () => {
  // Connect to the MongoDB preemptively to detect problems early and avoid
  // delaying the first request. If this fails, it may not be fatal, because
  // the mongo client will try to connect when used.
  await config.mongo.connect();
}, 'mongo-connect');
