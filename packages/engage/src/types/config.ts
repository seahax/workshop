export interface Config {
  /**
   * The application name. Defaults to the `name` field in `package.json`.
   */
  readonly app: string;

  /**
   * Custom domain names to associate with the CloudFront distribution.
   */
  readonly domains?: readonly string[];

  /**
   * AWS credentials configuration.
   */
  readonly aws?: {
    /**
     * The AWS region identifier where the S3 bucket and any other regional
     * resources will be deployed. Defaults to the region indicated by
     * environment variables, AWS profile, or `"us-east-2"` if no default is
     * found.
     */
    readonly region?: string;

    /**
     * The AWS credentials profile to use when deploying the application.
     */
    readonly profile?: string;

    /**
     * The AWS account ID(s) where the application is allowed to be deployed. If
     * the available credentials do not match an account ID, then deployment is
     * aborted.
     */
    readonly accounts?: readonly (string | number)[];
  };

  /**
   * AWS CloudFront configuration.
   */
  readonly cdn?: {
    /**
     * The local directory to synchronize with the SPA AWS S3 bucket. Defaults to
     * `"./dist"` relative to the config file.
     */
    readonly source?: string;

    /**
     * The logging level for the CloudFront distribution. Defaults to
     * `"basic"`.
     */
    readonly logging?: 'none' | 'basic' | 'debug';

    /**
     * Set a cache control response header for files matching glob patterns.
     *
     * Example:
     * ```yaml
     * caching:
     *   "*.html": "max-age=0"
     * ```
     */
    readonly caching?: Readonly<Record<string, string>>;

    /**
     * Override the default content types for files matching glob patterns.
     *
     * Example:
     * ```yaml
     * types:
     *   "*.json": "application/json"
     * ```
     */
    readonly types?: Readonly<Record<string, string>>;

    /**
     * Custom responses for the root URL and errors. Set this to `"spa"` to
     * enable default SPA behavior.
     *
     * Default SPA responses:
     *
     * ```ts
     * {
     *   root: '/index.html',
     *   errors: {
     *     403: {
     *       path: '/index.html',
     *       status: 200,
     *     },
     *     404: {
     *       path: '/index.html',
     *       status: 200,
     *     },
     *   },
     * }
     * ```
     */
    readonly responses?: 'spa' | {
      readonly root?: string;
      readonly errors?: Readonly<Record<number, {
        readonly path: string;
        readonly status: number;
      }>>;
    };
  };
}

export interface ResolvedConfig extends Config {
  readonly app: string;
  readonly domains: readonly string[];
  readonly aws: {
    readonly region: string;
    readonly accounts: readonly string[];
    readonly profile: string | undefined;
  };
  readonly cdn: {
    readonly source: string;
    readonly logging: 'none' | 'basic' | 'debug';
    readonly caching: Readonly<Record<string, string>>;
    readonly types: Readonly<Record<string, string>>;
    readonly responses: {
      readonly root?: string;
      readonly errors: Readonly<Record<number, {
        readonly path: string;
        readonly status: number;
      }>>;
    };
  };
}
