import Cache from 'quick-lru';

interface UserRepository {
  getUser(query: { id: string } | { email: string }): Promise<User | null>;
}

export interface User {
  readonly id: string;
  readonly email: string;
}

export function createUserRepository(): UserRepository {
  const cacheByEmail = new Cache<string, User>({ maxSize: 1000 });
  const cacheById = new Cache<string, User>({ maxSize: 1000 });

  return {
    async getUser(query) {
      const [key, cache] = 'id' in query ? [query.id, cacheById] : [query.email, cacheByEmail];
      // TODO: Get user from database.
      const user = cache.get(key) ?? null;

      if (user) {
        cacheByEmail.set(user.email, user);
        cacheById.set(user.id, user);
      }

      return user;
    },
  };
}
