# @seahax/service

Dependency injection done light.

## Example

```typescript
import { service } from '@seahax/service';
import { MongoClient } from 'mongodb';

// Create a MongoDB database service
const database = service().build(() => {
  const client = new MongoClient('mongodb://localhost:27017');
  client.connect();
  return client.db('myapp');
});

// Create a user service that depends on the database
const userService = service()
  .use(database)
  .build((db) => ({
    createUser: async (name: string) => {
      const result = await db.collection('users').insertOne({ name });
      return result.insertedId;
    },
    getUser: async (id: string) => {
      return await db.collection('users').findOne({ _id: id });
    },
  }));

// Use the service - database connection is reused
const users = userService.resolve();
const id = await users.createUser('Alice');
const user = await users.getUser(id);
console.log(user); // { _id: ..., name: 'Alice' }
```
