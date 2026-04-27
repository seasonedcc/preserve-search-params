# @preserve-search-params/react-router

Preserve URL search params across navigations and form submissions in React Router v7+ apps.

The wrappers read the current location automatically with `useLocation()`, so you don't have to thread the URL through your component tree. Drop them in where you'd use a regular `<Link>` or `<Form>`, and your pagination, filters, sort, and tab state stick around across navigations.

## Install

```bash
pnpm add @preserve-search-params/react-router
```

`react` (>=18) and `react-router` (>=7) are peer dependencies.

## Quick example

```tsx
import { SearchParamsLink } from '@preserve-search-params/react-router'

// Rendered on /items?page=2&filter=active
<SearchParamsLink to="/items/123">Open</SearchParamsLink>
// → /items/123?page=2&filter=active
```

The rest of this README is variations: which params to preserve, which to override.

## Cookbook

### Open a detail page (preserve everything)

The default. Every param in the current URL flows through to the destination, so the back button takes the user to the exact same view.

```tsx
<SearchParamsLink to="/items/123">Open</SearchParamsLink>
```

### Reset to a clean list

Drop everything. Useful for a "Clear filters" or "Reset" button.

```tsx
<SearchParamsLink to="/items" preserve={[]}>
  Reset
</SearchParamsLink>
```

### Switch tabs without losing filters

Tabs share the surrounding context (filters, sort, pagination). You only override `tab`.

```tsx
<SearchParamsLink to="/items" customValues={{ tab: 'observations' }}>
  Observations
</SearchParamsLink>
```

### Reset pagination when the filter changes

If the user is on page 5 of one filter, they shouldn't land on page 5 of another. Set `page` to `null` to clear it.

```tsx
<SearchParamsLink
  to="/items"
  customValues={{ status: 'archived', page: null }}
>
  Archived
</SearchParamsLink>
```

### Submit a filter form

GET-method form that preserves whatever's already on the URL and adds the form fields on top.

```tsx
import { SearchParamsForm } from '@preserve-search-params/react-router'

<SearchParamsForm action="/items">
  <input type="text" name="q" placeholder="Search" />
  <button type="submit">Search</button>
</SearchParamsForm>
```

The form renders one hidden `<input>` per preserved param, so submitting it takes the user to `/items?<preserved>&q=<typed>`.

### Reset pagination on filter form submit

Searching from page 5 should land you on page 1 of the new search.

```tsx
<SearchParamsForm action="/items" customValues={{ page: null }}>
  <input type="text" name="q" />
  <button type="submit">Search</button>
</SearchParamsForm>
```

### Put a filter object on the URL

Filters often have shape: status, tags, date ranges. `customValues` accepts arbitrary nesting and serializes with bracket notation.

```tsx
<SearchParamsLink
  to="/items"
  customValues={{
    filter: { status: 'active', tags: ['urgent', 'review'] },
    page: null,
  }}
>
  Apply
</SearchParamsLink>
// → /items?filter[status]=active&filter[tags][]=urgent&filter[tags][]=review
```

See the [core README's `customValues` is recursive section](../core/README.md#customvalues-is-recursive) for the full serialization rules.

### Render a custom Link component

Pass `component` to swap the underlying Link with full prop inference. Required props from the custom component remain required at the call site.

```tsx
import { StyledLink } from '~/ui/styled-link'

<SearchParamsLink
  to="/items"
  component={StyledLink}
  variant="primary"
>
  Open
</SearchParamsLink>
```

If `StyledLink` requires `variant`, the type-checker requires it here too. The mechanism is detailed below in [TypeScript: how the polymorphic `component` prop is typed](#typescript-how-the-polymorphic-component-prop-is-typed).

### Navigate programmatically

`useResolvedPathWithSearchParams` returns a `Path` object with the preserved `search` already on it. Hand it to `useNavigate()` or any RR primitive that takes a `Path`.

```tsx
import { useNavigate } from 'react-router'
import { useResolvedPathWithSearchParams } from '@preserve-search-params/react-router'

function GoToObservations() {
  const navigate = useNavigate()
  const path = useResolvedPathWithSearchParams('/items', {
    customValues: { tab: 'observations' },
  })
  return <button onClick={() => navigate(path)}>Go</button>
}
```

### Submit through a fetcher

Use a fetcher when you want to revalidate data without leaving the current page (typical for inline filter chips, or pagination buttons that reload a list in place).

```tsx
import { useFetcher } from 'react-router'

function ArchivedChip() {
  const fetcher = useFetcher()
  return (
    <SearchParamsForm
      fetcher={fetcher}
      action="/items"
      customValues={{ status: 'archived', page: null }}
    >
      <button type="submit">Archived</button>
    </SearchParamsForm>
  )
}
```

Note: when `fetcher` is supplied, the form does not auto-preserve the current URL's params. The request carries only `customValues` plus form fields. Use the non-fetcher variant when you want the current URL preserved into the submission.

### Server-side `redirect()` after a mutation

`redirectPathWithSearchParams` builds the destination string from the request and a target path, preserving the request's params and merging anything already on the path. Pass the result straight to RR's `redirect()`.

```ts
import { redirect, type ActionFunctionArgs } from 'react-router'
import { redirectPathWithSearchParams } from '@preserve-search-params/react-router'

export async function action({ request }: ActionFunctionArgs) {
  // ... mutation
  return redirect(
    redirectPathWithSearchParams(request, '/items', {
      customValues: { page: null },
    })
  )
}
```

If you'd rather build the query string yourself, the lower-level `preserveSearchParams(new URL(request.url).searchParams, opts).toString()` recipe still works.

### Build a URL string

When you need the raw query string (logging, an `<a href>` you don't want to wrap, a prefetch hint):

```ts
const search = preserveSearchParams(currentSearchParams, opts).toString()
const href = `/items?${search}`
```

## API reference

### `<SearchParamsLink>`

Wraps `Link` from `react-router`. Reads the current location with `useLocation()` and computes the destination URL with preservation rules applied.

| Prop | Type | Description |
|---|---|---|
| `to` | `To` | Same as RR's `Link`. |
| `relative` | `'route' \| 'path'` | Same as RR's `Link`. |
| `preserve` | `'all' \| string[]` | Default `'all'`. See [Behavior at a glance](../../README.md#behavior-at-a-glance). |
| `customValues` | `SearchParamsValues` | Set, override, or clear specific keys (recursive). `null` clears. |
| `component` | `ElementOrComponent` | Optional. Swap the underlying Link. Inherits its props. |
| `children` | `React.ReactNode` | Link contents. |

All other props pass through to the underlying Link (or `component` if supplied).

### `<SearchParamsForm>`

GET-method form wrapper. Renders one hidden `<input>` per preserved param.

| Prop | Type | Description |
|---|---|---|
| `action` | `string` | Form target (RR `FormProps`). |
| `method` | `'get'` (default) | RR `FormProps`. |
| `preserve` | `'all' \| string[]` | Default `'all'`. |
| `customValues` | `SearchParamsValues` | Set, override, or clear keys (recursive). |
| `fetcher` | `FetcherWithComponents<unknown>` | Optional. Submit through a fetcher instead of a full navigation. See note in the cookbook. |
| `children` | `React.ReactNode` | Form contents. |

All other props pass through to RR's `Form` (or `fetcher.Form` when a fetcher is supplied).

### `useResolvedPathWithSearchParams(to, options?)`

```ts
function useResolvedPathWithSearchParams(
  to: To,
  options?: { relative?: 'route' | 'path' } & SearchParamsPreserveOptions
): Path
```

Wraps RR's `useResolvedPath` and replaces the `search` portion with the preserved query string. Use it for imperative navigation (`useNavigate`), prefetch URLs, or anywhere a `Path` is expected.

### `redirectPathWithSearchParams(request, path, options?)`

```ts
function redirectPathWithSearchParams(
  request: Request,
  path: string,
  options?: SearchParamsPreserveOptions
): string
```

Builds a redirect destination from an incoming `Request` and a target path. Preserves the request's search params (subject to `options.preserve`) and merges any params already on `path` via `customValues`. `options.customValues` overrides path-supplied params with the same key. The path's hash is preserved.

### Re-exports

```ts
import {
  preserveSearchParams,
  redirectPathWithSearchParams,
  serializeToSearchParams,
} from '@preserve-search-params/react-router'
import type {
  ElementOrComponent,
  PropsOf,
  SearchParamsFormOwnProps,
  SearchParamsFormProps,
  SearchParamsLinkOwnProps,
  SearchParamsLinkProps,
  SearchParamsPreserveOptions,
  SearchParamsValue,
  SearchParamsValues,
  UseResolvedPathWithSearchParamsOptions,
} from '@preserve-search-params/react-router'
```

## TypeScript: how the polymorphic `component` prop is typed

### What you get

When you pass `component={Foo}`, `Foo`'s required and optional props become required and optional on `<SearchParamsLink>`. If you don't pass `component`, the call site behaves as if you'd used RR's `Link` directly.

```tsx
// No component → RR's LinkProps
<SearchParamsLink to="/x" prefetch="intent">Open</SearchParamsLink>

// With component → the custom component's props
<SearchParamsLink to="/x" component={StyledLink} variant="primary">
  Open
</SearchParamsLink>
// Compile error if `variant` is required on StyledLink and you forget it.
```

Our own keys (`to`, `relative`, `preserve`, `customValues`, `component`, `children`) are declared exactly once. If the underlying component happens to declare a same-named prop, ours wins.

### The mechanism

It's a `PropsOf<T>` utility plus one `Omit`:

```ts
type ElementOrComponent =
  | keyof JSX.IntrinsicElements
  | React.ComponentType<any>

type PropsOf<T> = T extends React.ComponentType<infer P>
  ? P
  : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : never

type Props<C extends ElementOrComponent = typeof Link> =
  OwnProps & { component?: C } & Omit<PropsOf<C>, keyof OwnProps | 'component'>
```

`Omit<PropsOf<C>, ourKeys>` strips our keys from the underlying component's props so they're declared only once and our types always win. `forwardRef` components work as `component` values.

The default generic `C = typeof Link` only kicks in when `component` is absent. When you pass `component={StyledLink}`, TypeScript infers `C` from the value and the default is ignored.

## License

[MIT](../../LICENSE.md)
