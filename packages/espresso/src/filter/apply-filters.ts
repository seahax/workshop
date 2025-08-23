import type { Request } from '../request/request.ts';
import type { Response } from '../response/response.ts';
import type { Filter } from './filter.ts';

export async function applyFilters(
  filters: readonly Filter[],
  request: Request<{}>,
  response: Response,
): Promise<void> {
  for (const filter of filters) {
    await filter(request, response);
    if (response.sent) return;
  }
}
