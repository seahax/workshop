# seahax.com/go/shorthand

Utility functions for simple value manipulation.

## Coalesce

Return the first non-nil, non-zero value from the variadic arguments.

```go
firstNonNilOrZero := shorthand.Coalesce(maybeNil, alsoMaybeNil, "default value")
```

## First

Return the first element of a slice, or the zero value if the slice is empty.

```go
firstOrZero := shorthand.First(slice)
```

## Last

Return the last element of a slice, or the zero value if the slice is empty.

```go
lastOrZero := shorthand.Last(slice)
```

## Select

Map a slice of values to a new slice with the same length with values
transformed by the selector function.

```go
selected := shorthand.Select(slice, func(item T) V { return item.SomeField })
```
