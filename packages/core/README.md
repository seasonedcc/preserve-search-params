# preserve-search-params

Zero-dependency, framework-agnostic helpers for preserving URL search params across navigations and form submissions.

The pure core. Most apps want one of the framework adapters built on top of it:

- [`@preserve-search-params/react-router`](../react-router) — for React Router v7+
- [`@preserve-search-params/next`](../next) — for Next.js (App Router and Pages Router)

## Why

Building list-heavy apps where pagination, filters, sort, and tab state must survive round-trips (list → detail → form → back to list) is tedious without helpers. This library makes that "second nature": URL becomes the source of truth, and preserving (or selectively modifying) it across navigations takes one prop.

## Install

```bash
pnpm add preserve-search-params
```

## API

### `preserveSearchParams(search, options?)`

Takes a `URLSearchParams` and returns a new `URLSearchParams` with the preservation rules applied.

```ts
import { preserveSearchParams } from 'preserve-search-params'

// Default: preserve everything
preserveSearchParams(new URLSearchParams('page=2&filter=active'))
// page=2&filter=active

// Preserve nothing
preserveSearchParams(new URLSearchParams('page=2&filter=active'), {
  preserve: [],
})
// (empty)

// Preserve only specific params
preserveSearchParams(new URLSearchParams('page=2&filter=active&tab=info'), {
  preserve: ['page', 'tab'],
})
// page=2&tab=info

// Set / override / clear specific values (after preservation)
preserveSearchParams(new URLSearchParams('page=2&tab=info'), {
  customValues: { tab: 'observations', page: null },
})
// tab=observations
```

### `customValues` is recursive

Nested objects and arrays serialize with bracket notation, making URL-as-state for complex filter shapes trivial:

```ts
preserveSearchParams(new URLSearchParams(), {
  customValues: {
    filter: { status: 'active', tags: ['urgent', 'review'] },
    page: 2,
  },
})
// filter[status]=active&filter[tags][]=urgent&filter[tags][]=review&page=2
```

### Options

```ts
type SearchParamsPreserveOptions = {
  preserve?: 'all' | string[]                            // default 'all'
  customValues?: Record<string, SearchParamsValue>
}

type SearchParamsValue =
  | string | number | boolean | null
  | SearchParamsValue[]
  | { [key: string]: SearchParamsValue }
```

- `preserve: 'all'` (default) — keep every param from `search`.
- `preserve: []` — drop everything.
- `preserve: ['tab', 'q']` — keep only these (exact, case-sensitive match).
- `customValues` — set/override/clear specific keys after preservation. `null` clears.

### `serializeToSearchParams(params, value, prefix)`

Lower-level utility. Mutates `params` by appending the serialized form of `value` under `prefix`. Same recursive bracket-notation rules as `customValues`.

## Composition examples

`preserveSearchParams` is sync and pure — it composes cleanly with any framework. Use `URLSearchParams.toString()` to build a final href.

```ts
// Imperative client navigation (any framework)
const next = preserveSearchParams(currentSearch, {
  customValues: { tab: 'observations' },
})
router.push(`/items?${next}`)

// Server-side redirect (any framework)
const next = preserveSearchParams(new URL(request.url).searchParams, opts)
return redirect(`/items?${next}`)
```

## License

[MIT](../../LICENSE.md)
