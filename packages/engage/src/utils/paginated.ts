interface Page<TValue, TNext> {
  readonly values: readonly TValue[] | undefined;
  readonly next: TNext | undefined;
}

export async function * paginated<TValue, TNext = string>(
  getPage: (next?: TNext) => Promise<Page<TValue, TNext>>,
): AsyncGenerator<TValue, void, void> {
  let next: TNext | undefined;

  do {
    const result = await getPage(next);
    next = result.next;
    if (result.values?.length) yield * result.values;
  } while (next != null);
}
