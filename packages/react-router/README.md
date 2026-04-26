# @preserve-search-params/react-router

React Router v7+ adapter for [`preserve-search-params`](../core).

Wrappers that read the current URL from `useLocation` and apply preservation rules to links, forms, and resolved paths.

## Install

```bash
pnpm add @preserve-search-params/react-router
```

`react` and `react-router` are peer dependencies.

## API

### `<SearchParamsLink>`

Wraps `Link` from `react-router`. Reads the current location automatically and computes the destination URL with preservation rules applied.

```tsx
import { SearchParamsLink } from '@preserve-search-params/react-router'

// On /items?page=2&filter=active — clicking goes to /items/123?page=2&filter=active
<SearchParamsLink to="/items/123">Open</SearchParamsLink>

// Drop everything
<SearchParamsLink to="/items" preserve={[]}>Reset</SearchParamsLink>

// Keep only specific params
<SearchParamsLink to="/items" preserve={['q']}>Search results</SearchParamsLink>

// Set / override / clear specific values
<SearchParamsLink to="/items" customValues={{ tab: 'observations', page: null }}>
  Observations
</SearchParamsLink>
```

The `component` prop swaps the underlying Link for full custom control:

```tsx
<SearchParamsLink to="/items" component={MyStyledLink} variant="primary">
  Open
</SearchParamsLink>
```

`MyStyledLink`'s required props (e.g. `variant`) are required at the call site with full type-checking.

### `<SearchParamsForm>`

GET-method form wrapper. Renders one hidden `<input>` per preserved param; submitting the form navigates to the action URL with those params attached.

```tsx
<SearchParamsForm action="/items">
  <input type="text" name="q" />
  <button type="submit">Search</button>
</SearchParamsForm>
```

Reset pagination on submit while preserving filters:

```tsx
<SearchParamsForm action="/items" customValues={{ page: null }}>
  <input type="text" name="q" />
</SearchParamsForm>
```

Pass `fetcher` to use a fetcher-bound form:

```tsx
const fetcher = useFetcher()
<SearchParamsForm fetcher={fetcher} action="/items">…</SearchParamsForm>
```

### `useResolvedPathWithSearchParams(to, options?)`

Wraps React Router's `useResolvedPath` and overrides the `search` portion with preserved params. Use it for imperative navigation, prefetch URLs, or anywhere a `Path` is expected.

```tsx
const path = useResolvedPathWithSearchParams('/items', {
  customValues: { tab: 'observations' },
})
navigate(path)
```

### Re-exports

```tsx
import {
  preserveSearchParams,
  serializeToSearchParams,
} from '@preserve-search-params/react-router'
import type {
  SearchParamsPreserveOptions,
  SearchParamsValue,
  SearchParamsValues,
} from '@preserve-search-params/react-router'
```

## Server-side preservation

For loaders, actions, and `redirect()`, use the core function directly:

```ts
import { preserveSearchParams } from '@preserve-search-params/react-router'
import { redirect } from 'react-router'

export async function action({ request }: ActionFunctionArgs) {
  // ... mutation
  const search = preserveSearchParams(new URL(request.url).searchParams).toString()
  return redirect(`/items?${search}`)
}
```

## License

[MIT](../../LICENSE.md)
