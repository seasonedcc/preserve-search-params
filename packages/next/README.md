# @preserve-search-params/next

Preserve URL search params across navigations and form submissions in Next.js apps.

The components are pure (no `'use client'`) and accept the current URL's search params as a prop. The same component works in App Router server components, App Router client components, and Pages Router pages — you read the URL once per page in whichever way fits, and pass the result down.

## Install

```bash
pnpm add @preserve-search-params/next
```

`react` (>=18) and `next` (>=14) are peer dependencies.

## Quick example

```tsx
import { SearchParamsLink } from '@preserve-search-params/next'

// current = new URLSearchParams('page=2&filter=active')
<SearchParamsLink href="/items/123" currentSearchParams={current}>
  Open
</SearchParamsLink>
// → /items/123?page=2&filter=active
```

The component is the same everywhere. What changes between contexts is how you build `current`.

## Reading the current URL

App Router and Pages Router expose different APIs for the URL. The wrappers don't care which one you use. Pick the line that matches your context.

### App Router server component

`searchParams` is a `Promise` of a string-or-string-array map. Build a `URLSearchParams` once and pass it down.

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const resolved = await searchParams
  const current = new URLSearchParams()
  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) {
      for (const v of value) current.append(key, v)
    } else if (value != null) {
      current.append(key, value)
    }
  }

  return (
    <SearchParamsLink href="/items/123" currentSearchParams={current}>
      Open
    </SearchParamsLink>
  )
}
```

### App Router client component

```tsx
'use client'
import { useSearchParams } from 'next/navigation'

function Row() {
  const current = new URLSearchParams(useSearchParams())
  return (
    <SearchParamsLink href="/items/123" currentSearchParams={current}>
      Open
    </SearchParamsLink>
  )
}
```

### Pages Router

```tsx
import { useRouter } from 'next/router'

function Row() {
  const { asPath } = useRouter()
  const current = new URL(asPath, 'http://x').searchParams
  return (
    <SearchParamsLink href="/items/123" currentSearchParams={current}>
      Open
    </SearchParamsLink>
  )
}
```

Read once per page, thread the result down. The recipes below all assume `current` has been obtained one of these ways.

## Cookbook

### Open a detail page (preserve everything)

The default. Every param flows through to the destination, so the back button takes the user to the exact same view.

```tsx
<SearchParamsLink href="/items/123" currentSearchParams={current}>
  Open
</SearchParamsLink>
```

### Reset to a clean list

```tsx
<SearchParamsLink href="/items" currentSearchParams={current} preserve={[]}>
  Reset
</SearchParamsLink>
```

### Switch tabs without losing filters

```tsx
<SearchParamsLink
  href="/items"
  currentSearchParams={current}
  customValues={{ tab: 'observations' }}
>
  Observations
</SearchParamsLink>
```

### Reset pagination when the filter changes

If the user is on page 5 of one filter, they shouldn't land on page 5 of another.

```tsx
<SearchParamsLink
  href="/items"
  currentSearchParams={current}
  customValues={{ status: 'archived', page: null }}
>
  Archived
</SearchParamsLink>
```

### Submit a filter form

GET-method form that preserves whatever's already on the URL and adds the form fields on top.

```tsx
import { SearchParamsForm } from '@preserve-search-params/next'

<SearchParamsForm action="/items" currentSearchParams={current}>
  <input type="text" name="q" placeholder="Search" />
  <button type="submit">Search</button>
</SearchParamsForm>
```

The form renders one hidden `<input>` per preserved param, so submitting takes the user to `/items?<preserved>&q=<typed>`.

### Reset pagination on filter form submit

```tsx
<SearchParamsForm
  action="/items"
  currentSearchParams={current}
  customValues={{ page: null }}
>
  <input type="text" name="q" />
  <button type="submit">Search</button>
</SearchParamsForm>
```

### Put a filter object on the URL

Filters often have shape: status, tags, date ranges. `customValues` accepts arbitrary nesting and serializes with bracket notation.

```tsx
<SearchParamsLink
  href="/items"
  currentSearchParams={current}
  customValues={{
    filter: { status: 'active', tags: ['urgent', 'review'] },
    page: null,
  }}
>
  Apply
</SearchParamsLink>
// → /items?filter[status]=active&filter[tags][]=urgent&filter[tags][]=review
```

See the [core README's `customValues` is recursive section](../core/README.md#customvalues-is-recursive) for the full rules.

### Render a custom Link component

Pass `component` to swap the underlying Link with full prop inference.

```tsx
import { StyledLink } from '@/ui/styled-link'

<SearchParamsLink
  href="/items"
  currentSearchParams={current}
  component={StyledLink}
  variant="primary"
>
  Open
</SearchParamsLink>
```

If `StyledLink` requires `variant`, the type-checker requires it here too. The mechanism is detailed in [TypeScript: how the polymorphic `component` prop is typed](#typescript-how-the-polymorphic-component-prop-is-typed) below.

### Prefetch GET targets with `next/form`

Next 15+ ships a `Form` component that prefetches the action URL on hover and focus. Pass it as `component` and the prefetch works on the form too.

```tsx
import Form from 'next/form'

<SearchParamsForm
  action="/items"
  currentSearchParams={current}
  component={Form}
>
  <input type="text" name="q" />
  <button type="submit">Search</button>
</SearchParamsForm>
```

### Imperative `router.push` / `router.replace`

App Router client. Compose `preserveSearchParams` with `useRouter` from `next/navigation`.

```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { preserveSearchParams } from '@preserve-search-params/next'

function GoToObservations() {
  const router = useRouter()
  const current = new URLSearchParams(useSearchParams())
  return (
    <button
      onClick={() => {
        const search = preserveSearchParams(current, {
          customValues: { tab: 'observations' },
        }).toString()
        router.push(`/items?${search}`)
      }}
    >
      Go
    </button>
  )
}
```

### Server Action redirect

Server Actions don't have direct access to the current URL, so read the `referer` header to recover it, then hand it to `redirectPathWithSearchParams` along with the target path.

```ts
'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { redirectPathWithSearchParams } from '@preserve-search-params/next'

export async function archiveItem(id: string) {
  // ... mutation
  const referer = (await headers()).get('referer') ?? 'http://x/'
  redirect(
    redirectPathWithSearchParams(new Request(referer), '/items', {
      customValues: { page: null },
    })
  )
}
```

### `getServerSideProps` redirect (Pages Router)

```ts
import type { GetServerSideProps } from 'next'
import { redirectPathWithSearchParams } from '@preserve-search-params/next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const url = new URL(ctx.req.url ?? '/', 'http://x')
  return {
    redirect: {
      destination: redirectPathWithSearchParams(new Request(url), '/items', {
        customValues: { page: null },
      }),
      permanent: false,
    },
  }
}
```

### Build a URL string

When you need the raw query string (logging, an `<a href>` you don't want to wrap, a manual `<link rel="prefetch">`):

```ts
const search = preserveSearchParams(current, opts).toString()
const href = `/items?${search}`
```

## API reference

### `<SearchParamsLink>`

Wraps `next/link`. Computes the destination href with preservation rules applied to `currentSearchParams`.

| Prop | Type | Description |
|---|---|---|
| `href` | `string` | Destination path. Existing `?...` on the path is kept alongside the computed search params. |
| `currentSearchParams` | `URLSearchParams` | The current URL's search params, obtained by your context (server component, client component, or Pages Router). |
| `preserve` | `'all' \| string[]` | Default `'all'`. See [Behavior at a glance](../../README.md#behavior-at-a-glance). |
| `customValues` | `SearchParamsValues` | Set, override, or clear specific keys (recursive). `null` clears. |
| `component` | `ElementOrComponent` | Optional. Swap the underlying Link. Defaults to `next/link`'s `Link`. |
| `children` | `React.ReactNode` | Link contents. |

All other props pass through to the underlying Link (or `component` if supplied).

### `<SearchParamsForm>`

GET-method form wrapper. Renders one hidden `<input>` per preserved param.

| Prop | Type | Description |
|---|---|---|
| `action` | `string` | Form target. |
| `currentSearchParams` | `URLSearchParams` | The current URL's search params. |
| `preserve` | `'all' \| string[]` | Default `'all'`. |
| `customValues` | `SearchParamsValues` | Set, override, or clear keys (recursive). |
| `component` | `ElementOrComponent` | Optional. Defaults to `'form'`. Pass `next/form`'s `Form` for client-side prefetching of GET targets. |
| `children` | `React.ReactNode` | Form contents. |

All other props pass through to the underlying form (or `component` if supplied).

### `redirectPathWithSearchParams(request, path, options?)`

```ts
function redirectPathWithSearchParams(
  request: Request,
  path: string,
  options?: SearchParamsPreserveOptions
): string
```

Builds a redirect destination from an incoming `Request` and a target path. Preserves the request's search params (subject to `options.preserve`) and merges any params already on `path` via `customValues`. `options.customValues` overrides path-supplied params with the same key. The path's hash is preserved.

In Server Actions, where the current URL is not part of the call, build a `Request` from the `referer` header — see the Server Action redirect cookbook entry above.

### Re-exports

```ts
import {
  preserveSearchParams,
  redirectPathWithSearchParams,
  serializeToSearchParams,
} from '@preserve-search-params/next'
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
} from '@preserve-search-params/next'
```

## Why pure components instead of auto-reading hooks

App Router and Pages Router read the current URL through different APIs (`useSearchParams` from `next/navigation` vs `useRouter` from `next/router`), and App Router server components can't call client hooks at all. A hook-based wrapper would either need two subpath builds (`/app` vs `/pages`) or a forced `'use client'` directive that loses server-component compatibility.

Taking `currentSearchParams` as a prop sidesteps both. The same component works in App Router server components, App Router client components, Pages Router pages, and Pages Router client components, with no subpath split. The cost is reading the URL once per page (a couple of lines) instead of having the hook do it implicitly.

## TypeScript: how the polymorphic `component` prop is typed

### What you get

When you pass `component={Foo}`, `Foo`'s required and optional props become required and optional on the wrapper. Without `component`, the call site behaves as if you'd used the default underlying element directly.

```tsx
// SearchParamsLink defaults to next/link's Link
<SearchParamsLink
  href="/x"
  currentSearchParams={current}
  prefetch={false}
>
  Open
</SearchParamsLink>

// SearchParamsForm defaults to 'form'
<SearchParamsForm action="/items" currentSearchParams={current} onSubmit={fn}>
  …
</SearchParamsForm>

// With component={StyledLink} → StyledLink's props
<SearchParamsLink
  href="/x"
  currentSearchParams={current}
  component={StyledLink}
  variant="primary"
>
  Open
</SearchParamsLink>
```

Our own keys (`href`, `currentSearchParams`, `preserve`, `customValues`, `component`, `children` on Link; same minus `href` on Form) are declared exactly once. If the underlying component happens to declare a same-named prop, ours wins.

### The mechanism

```ts
type ElementOrComponent =
  | keyof JSX.IntrinsicElements
  | React.ComponentType<any>

type PropsOf<T> = T extends React.ComponentType<infer P>
  ? P
  : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : never

// SearchParamsLink: default C is typeof Link from next/link
type LinkProps<C extends ElementOrComponent = typeof Link> =
  OwnProps & { component?: C } & Omit<PropsOf<C>, keyof OwnProps | 'component'>

// SearchParamsForm: default C is 'form'
type FormProps<C extends ElementOrComponent = 'form'> =
  OwnProps & { component?: C } & Omit<PropsOf<C>, keyof OwnProps | 'component'>
```

`Omit<PropsOf<C>, ourKeys>` strips our keys from the underlying component's props so they're declared only once. `forwardRef` components work as `component` values.

The default generic only kicks in when `component` is absent. When you pass `component={Foo}`, TypeScript infers `C` from the value and the default is ignored.

## License

[MIT](../../LICENSE.md)
