export interface Package {
  name?: string;
  version?: string;
  private?: boolean;
  [key: string]: unknown;
}
