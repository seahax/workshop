# Changelog

## 0.6.7 - 2025-05-04

- __chore:__ update deps (ee28379)
- __chore:__ update deps (efb8c42)

## 0.6.6 - 2025-04-23

- __chore:__ refactor all the things (3211a53)

## 0.6.5 - 2025-04-03

- __chore:__ update deps (bf79548)

## 0.6.4 - 2025-03-04

- __chore:__ update deps (ae1e38c)

## 0.6.3 - 2025-02-06

- __chore:__ sort package.json files (7e2658f)
- __chore:__ remove unnecessary clean step from build scripts (5667218)
- __chore:__ default all tsconfigs to composite throw shared base (78b0008)
- __chore:__ version updates (4f5f731)

## 0.6.2 - 2025-02-05

- __chore:__ update configs for vite-plugin-lib changes (2d3822f)
- __chore:__ eslint changed to require extensions (tsconfig module bundler) (3562375)

## 0.6.1 - 2025-02-01

- __chore:__ refactored all the tsconfigs (80f8ffd)
- __chore:__ add shared vitest configs and tsconfig (095774c)

## 0.6.0 - 2025-01-24

- __feat:__ improve fix ordering, fix message templates, and fix some missed chain wrapping opportunities (e72ac40)
- __docs:__ correct auto fix order is AST order (7d1ddaa)

## 0.5.0 - 2025-01-23

- __feat:__ only wrap chained methods (0e0ecf3)

## 0.4.2 - 2025-01-23

- __fix:__ severity option should not allow 'off' (bee774e)
- __chore:__ remove tsx based jit loader for running non-compiled typescript source (9adbeca)

## 0.4.1 - 2025-01-23

- __docs:__ add severity option to docs (6b4cb76)

## 0.4.0 - 2025-01-23

- __feat:__ add severity option to config helper (ea2273c)
- __chore:__ add column to report messages (ad474f4)

## 0.3.0 - 2025-01-21

- __feat:__ add chain rule (b3db983)
- __feat:__ add export rule (807c787)
- __fix:__ correct report range for call/new expressions (546ffe5)
- __chore:__ add export package keyword (44b49ea)

## 0.2.0 - 2025-01-21

- __feat:__ allow `"tab"` value for the `tabWidth` option (92f8d95)
- __fix:__ wrap leading union pipe if it's already present (a79846f)
- __refactor!:__ change namespace to `@seahax/wrap` (instead of `@seahax-wrap` (8fcac68)
- __refactor:__ change padEnd to replace (60418ac)
- __chore:__ move eslint-plugin-wrap to packages and add it to the eslint package (ac908ec)
