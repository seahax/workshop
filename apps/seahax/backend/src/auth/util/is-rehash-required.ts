export function isRehashRequired(params0: Record<string, string | number>, params1: Record<string, unknown>): boolean {
  const entries = Object.entries(params0);

  return (
    entries.length !== Object.keys(params1).length
    || entries.some(([key, value]) => {
      if (!(key in params1)) return true;
      if (value !== params1[key]) return true;
      return false;
    })
  );
}
