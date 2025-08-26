import { createMiddlewareFilter } from '@seahax/espresso';
import morganMiddleware from 'morgan';

export const morgan = createMiddlewareFilter(morganMiddleware('combined'));
