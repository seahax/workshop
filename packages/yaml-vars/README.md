# @seahax/yaml-vars

Terraform style input variables in any YAML file.

- Handles multi-document YAML files.
- Preserves comments and formatting.

## Example

Write a YAML file with variable placeholders.

```yaml
${{vars}}:
  - key: foo # Duplicate keys will override previous values.
    type: string # Possible values are string, number, or boolean.
    default: FOO # Optional. Can be any scalar type.
some:
  other:
    yaml:
      path: ${{vars.foo}}
```

Replace all input variable placeholders with values from command line arguments (`<key>=<value>`) or variable definition defaults, and remove variable definition blocks (`${{vars}}`).

```sh
yaml-vars input.yaml foo=123
```

Output is written to STDOUT.

```yaml
some:
  other:
    yaml:
      path: "123"
```

The operation will fail in the following cases.

- A variable definitions block (`${{vars}}`) is malformed.
- A variable definition is not used.
- A variable placeholder does not match any variable definition.
- A variable argument value does not match the variable definition type.
- A variable argument is missing for a variable definition with no default.
