export function createSearchParametersProxy(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const self = new Proxy<Record<string, string | string[]>>(Object.create(null), {
    has(_, key: string) {
      return searchParams.has(key);
    },
    get(_, key: string) {
      const values = searchParams.getAll(key);
      if (values.length === 0) return undefined;
      if (values.length === 1) return values[0];
      return values;
    },
    set(_, key: string, value: string | string[]) {
      if (Array.isArray(value)) {
        searchParams.delete(key);
        value.forEach((v) => searchParams.append(key, v));
      }
      else {
        searchParams.set(key, value);
      }

      return true;
    },
    deleteProperty(_, key: string) {
      searchParams.delete(key);
      return true;
    },
    defineProperty() {
      throw new TypeError('Search parameters proxy does not support property definition');
    },
    getOwnPropertyDescriptor(_, key: string): PropertyDescriptor | undefined {
      if (searchParams.has(key)) {
        return { writable: true, enumerable: true, configurable: true, value: self[key] };
      }
    },
    ownKeys() {
      return Array.from(new Set(searchParams.keys()));
    },
  });

  return self;
}
