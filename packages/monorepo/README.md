# @seahax/monorepo

Recursively find and read monorepo package information.

- Packages that are inside a `node_modules` directory are ignored.
- Results are ordered so that dependencies come before their dependents.
- Local dependencies are linked by name only (regardless of version).

```ts
import { getPackages } from '@seahax/monorepo';

const results = await getPackages(process.cwd());
```

The results are an array of objects with the following properties.

- `filename`: The absolute path to the package.json file.
- `data`: The contents of the package.json file.
- `localDependencies`: An array of references to other entries in the results array.
