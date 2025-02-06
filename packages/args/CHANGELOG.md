# Changelog

## 0.3.5 - 2025-02-06

- __chore:__ sort package.json files (7e2658f)
- __chore:__ remove unnecessary clean step from build scripts (5667218)
- __chore:__ default all tsconfigs to composite throw shared base (78b0008)
- __chore:__ fix args test showing output (c6b5bdd)
- __chore:__ lint fixes (4257a3c)
- __chore:__ version updates (4f5f731)

## 0.3.4 - 2025-02-05

- __chore:__ update configs for vite-plugin-lib changes (2d3822f)
- __chore:__ eslint changed to require extensions (tsconfig module bundler) (3562375)

## 0.3.3 - 2025-02-02

- __fix:__ default version detection using args package version instead of the entry file package version (8b5cca1)

## 0.3.2 - 2025-02-01

- __chore:__ refactored all the tsconfigs (80f8ffd)
- __chore:__ add shared vitest configs and tsconfig (095774c)

## 0.3.1 - 2025-01-21

- __chore:__ add eslint-plugin-wrap package (665386f)

## 0.3.0 - 2025-01-16

- __feat:__ remove `required*` methods in favor of a `required` boolean option (402be56)
- __fix:__ correct boolean typing (9143033)
- __fix:__ failing tests (41f1784)
- __fix:__ honor the double-dash argument (c710cbd)
- __refactor:__ minor changes to parse (60212c3)
- __docs:__ a word (bc694e3)

## 0.2.0 - 2025-01-16

- fix required option parse type inference (`a326a4d`)
- release (`da0bda8`)
- refactor(args)!: remove required parse in favor of required config property (`4aaedd8`)
- refactor(args)!: fix types and automatically get the version for the version option (`3032689`)
