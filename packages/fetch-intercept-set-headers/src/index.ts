import { createIntercept, type Intercept } from '@seahax/fetch';

type Init<TValue> = TValue | ((request: Request) => TValue | Promise<TValue>);
type Empty = false | null | undefined;

export type HeaderPrimitive = string | number | Empty;
export type HeaderJson = Record<string, unknown>;
export type HeaderArray = readonly Init<HeaderPrimitive | HeaderJson>[];
export type HeaderValue = HeaderPrimitive | HeaderArray | HeaderJson;
export type Headers = Record<string, Init<HeaderValue>>;

export default function interceptSetHeaders(initHeaders: Init<Headers | Empty>): Intercept {
  return createIntercept(async (request, next) => {
    const headers = await resolveInit(initHeaders, request);

    if (!isEmpty(headers)) {
      for (const [name, initValue] of Object.entries(headers)) {
        const value = await resolveInit(initValue, request);

        if (isHeaderArray(value)) {
          request.headers.delete(name);

          for (const initPrimitive of value) {
            const primitive = await resolveInit(initPrimitive, request);

            if (isObject(primitive)) {
              request.headers.append(name, JSON.stringify(primitive));
            }
            else if (!isEmpty(primitive)) {
              request.headers.append(name, String(primitive));
            }
          }
        }
        else if (isObject(value)) {
          request.headers.set(name, JSON.stringify(value));
        }
        else if (!isEmpty(value)) {
          request.headers.set(name, String(value));
        }
      }
    }

    return await next(request);
  });
}

function isEmpty(value: unknown): value is Empty {
  return value == null || value === false;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isHeaderArray(value: unknown): value is HeaderArray {
  return Array.isArray(value);
}

async function resolveInit<TValue>(
  init: Init<TValue>,
  request: Request,
): Promise<TValue> {
  return (
    typeof init === 'function'
      ? (init as (request: Request) => TValue | Promise<TValue>)(request)
      : init
  );
}
