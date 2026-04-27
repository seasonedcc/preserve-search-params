# preserve-search-params

The framework-agnostic primitive for preserving URL search params. Zero dependencies, sync, pure.

Most apps want one of the framework adapters built on top of this. Reach for the core directly when there's no adapter for your framework yet, or when you're composing with your own primitives.

- [`@preserve-search-params/react-router`](../react-router) for React Router v7+ apps
- [`@preserve-search-params/next`](../next) for Next.js apps (App Router and Pages Router)

## Install

```bash
pnpm add preserve-search-params
```

## Mental model

Input is a `URLSearchParams`. Output is a new `URLSearchParams`. Sync, pure, no I/O. You feed in the current URL's params, optionally narrow them down or set new values, and get back a copy ready to be turned into a query string.

## `preserveSearchParams(search, options?)`

Four shapes of call cover everything.

### Preserve everything (default)

```ts
import { preserveSearchParams } from 'preserve-search-params'

preserveSearchParams(new URLSearchParams('page=2&filter=active')).toString()
// → page=2&filter=active
```

### Drop everything

For a reset link or button.

```ts
preserveSearchParams(new URLSearchParams('page=2&filter=active'), {
  preserve: [],
}).toString()
// → (empty string)
```

### Allow-list specific params

Match is exact and case-sensitive.

```ts
preserveSearchParams(new URLSearchParams('page=2&filter=active&q=hello'), {
  preserve: ['page', 'q'],
}).toString()
// → page=2&q=hello
```

### Set, override, or clear specific values

`customValues` runs after preservation. Setting a key to `null` clears it.

```ts
preserveSearchParams(new URLSearchParams('page=2&tab=info&drop=this'), {
  customValues: { tab: 'observations', drop: null, sort: 'name' },
}).toString()
// → page=2&tab=observations&sort=name
```

## `customValues` is recursive

Nested objects and arrays serialize with bracket notation. Filter shapes of arbitrary depth go straight onto the URL.

```ts
preserveSearchParams(new URLSearchParams(), {
  customValues: {
    filter: { status: 'active', tags: ['urgent', 'review'] },
    page: 2,
  },
}).toString()
// → filter%5Bstatus%5D=active&filter%5Btags%5D%5B%5D=urgent&filter%5Btags%5D%5B%5D=review&page=2
```

Decoded for readability:

```
filter[status]=active
filter[tags][]=urgent
filter[tags][]=review
page=2
```

Behavior summary:

- Arrays of primitives use the bare-prefix form: `tags[]=urgent&tags[]=review`.
- Arrays of objects use indexed bracket form: `users[0][name]=Alice&users[1][name]=Bob`.
- Nested arrays under an already-bracketed prefix use indexed bracket form: `filter[scores][0]=1`.
- Setting any nested key to `null` removes only that key. Setting an entire object subtree to `null` removes the whole subtree.

## Composition recipes

These are the patterns the framework adapters layer on top of. If your framework doesn't have an adapter yet, use them directly.

### Build a URL string

```ts
const search = preserveSearchParams(currentSearchParams, {
  customValues: { tab: 'observations' },
}).toString()
const href = `/items?${search}`
```

### Imperative client navigation

Pass the result to whatever your framework's router expects.

```ts
const search = preserveSearchParams(currentSearchParams, {
  customValues: { page: null },
}).toString()
router.push(`/items?${search}`)
```

### Server-side redirect

Read the request URL's `searchParams`, pipe through, return your framework's redirect.

```ts
const url = new URL(request.url)
const search = preserveSearchParams(url.searchParams, {
  customValues: { page: null },
}).toString()
return redirect(`/items?${search}`)
```

## `serializeToSearchParams(params, value, prefix)`

The lower-level utility behind `customValues`. It mutates `params` in place by appending `value` under `prefix`, using the same recursive bracket notation.

```ts
import { serializeToSearchParams } from 'preserve-search-params'

const params = new URLSearchParams()
serializeToSearchParams(
  params,
  { status: 'active', tags: ['urgent'] },
  'filter'
)
params.toString()
// → filter%5Bstatus%5D=active&filter%5Btags%5D%5B%5D=urgent
```

Most users want `preserveSearchParams`. Reach for `serializeToSearchParams` when you want to append bracket-notation key/value pairs onto an existing `URLSearchParams` without going through the preservation step.

## API reference

```ts
function preserveSearchParams(
  search: URLSearchParams,
  options?: SearchParamsPreserveOptions
): URLSearchParams

function serializeToSearchParams(
  params: URLSearchParams,
  value: SearchParamsValue,
  prefix: string
): void

type SearchParamsPreserveOptions = {
  preserve?: 'all' | string[]            // default 'all'
  customValues?: SearchParamsValues
}

type SearchParamsValue =
  | string
  | number
  | boolean
  | null
  | SearchParamsValue[]
  | { [key: string]: SearchParamsValue }

type SearchParamsValues = Record<string, SearchParamsValue>
```

## License

[MIT](../../LICENSE.md)
