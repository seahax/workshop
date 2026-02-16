# seahax: workshop

My little workshop of code.

This is where I keep all my personal hacks. It's for fun and learning. Things in here may or may not be published, but if they are, they will be under the [Unlicense](https://unlicense.org/).

## Monorepo

While this is a monorepo, it does not use any monorepo tooling. Treat every project as if it were in its own repository. Even if a project has a dependency on another project in this monorepo, it will still use the published version of that project from NPM (TS projects) or Github (Go projects).

While this approach might not be a common or sustainable in a professional setting, I find it simpler to manage and reason about. I'm not a subscriber to DRY (Don't Repeat Yourself) as an absolute. I find that sometimes duplication (WET, aka: Write Everything Twice) is more correct and creates less technical debt in the long run, though it can also be a problem if taken to an extreme.
