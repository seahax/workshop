interface JwkRepository {}

export interface Jwk {
  readonly alg: 'ES256';
  readonly kty: 'EC';
  readonly use: 'sig';
  readonly key_ops: ['verify'];
  readonly crv: 'P-256';
  readonly kid: string;
  readonly x: string;
  readonly y: string;
}

export function createJwkRepository(): JwkRepository {
  // TODO: Add JWK repository.
  return {};
}
