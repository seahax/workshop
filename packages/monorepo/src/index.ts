import fs from 'node:fs/promises';
import path from 'node:path';

export interface PackageResult<TName extends string = string> {
  readonly filename: string;
  readonly data: PackageData<TName>;
  readonly localDependencies: readonly PackageResult[];
}

export interface PackageData<TName extends string = string> {
  readonly name: TName;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly [key: string]: unknown;
}

export async function getPackages(dir: string): Promise<PackageResult[]> {
  const entries = new Map<string, [filename: string, data: PackageData]>();
  const results = new Map<string, PackageResult>();

  for await (const entry of getPackageGenerator(dir)) {
    const name = entry[1].name;

    if (entries.has(name)) {
      throw new Error(`Package name "${name}" is duplicated`);
    }

    entries.set(name, entry);
  }

  for (const entry of entries.values()) {
    await addResult(entry, []);
  }

  return Array.from(results.values());

  async function addResult(
    [filename, data]: [filename: string, data: PackageData],
    dependentNames: readonly string[],
  ): Promise<PackageResult> {
    if (dependentNames.includes(data.name)) {
      throw new Error(`Package "${data.name}" circularly depends on itself`);
    }

    const existingResult = results.get(data.name);

    if (existingResult) return existingResult;

    const localDependencies: PackageResult[] = [];
    const result: PackageResult = { filename, data, localDependencies };
    const dependencyNames = await getDependencyNames(result);

    for (const dependencyName of dependencyNames) {
      const entry = entries.get(dependencyName);
      if (!entry) continue;
      const localDependency = await addResult(entry, [...dependentNames, data.name]);
      localDependencies.push(localDependency);
    }

    results.set(data.name, result);

    return result;
  }
}

async function getDependencyNames(result: PackageResult): Promise<Set<string>> {
  const names = new Set<string>();
  const entries = [
    ...Object.entries(result.data.dependencies || {}),
    ...Object.entries(result.data.peerDependencies || {}),
    ...Object.entries(result.data.optionalDependencies || {}),
    ...Object.entries(result.data.devDependencies || {}),
  ];

  for (const [name, version] of entries) {
    const fileMatch = version.match(/^(?:file:(.+)|([.~/].*))/u);

    if (fileMatch) {
      const dir = path.resolve(path.dirname(result.filename), (fileMatch[1] ?? fileMatch[2])!);
      const data = await readPackageData(path.join(dir, 'package.json'));
      if (!data.name) throw new Error(`Package at "${dir}" has no name.`);
      names.add(data.name);
      continue;
    }

    const workspaceMatch = version.match(/^workspace:(?:(.+)(?=@))?/u);

    if (workspaceMatch) {
      names.add(workspaceMatch[1] ?? name);
      continue;
    }

    const npmMatch = version.match(/^npm:(.[^@]*)/u);

    if (npmMatch) {
      names.add(npmMatch[1]!);
      continue;
    }

    names.add(name);
  }

  return names;
}

async function* getPackageGenerator(dir: string): AsyncGenerator<[filename: string, data: PackageData]> {
  for await (const filename of findPackageFilenames(dir)) {
    const data = await readPackageData(filename);
    yield [filename, data];
  }
}

async function readPackageData(filename: string): Promise<PackageData> {
  const content = await fs.readFile(filename, 'utf8');
  return JSON.parse(content);
}

async function* findPackageFilenames(dir = '.'): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'package.json' && entry.isFile()) {
      yield path.resolve(dir, entry.name);
      continue;
    }

    if (entry.isDirectory() && entry.name !== 'node_modules') {
      yield* findPackageFilenames(path.join(dir, entry.name));
      continue;
    }
  }
}
