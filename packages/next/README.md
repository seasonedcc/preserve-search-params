# @preserve-search-params/next

Next.js adapter for [`preserve-search-params`](../core). Works with **App Router** and **Pages Router**, in **server components** and **client components**.

The components are pure (no `'use client'`) and accept the current URL's search params as a prop. You read the URL once per page in whatever way fits your context, and pass the result down. No hooks inside the wrappers, no subpath split.

## Install

```bash
pnpm add @preserve-search-params/next
```

`react` and `next` are peer dependencies.

## API

### `<SearchParamsLink>`

Wraps `next/link`. Computes the destination href with preservation rules applied to `currentSearchParams`.

```tsx
import { SearchParamsLink } from '@preserve-search-params/next'

<SearchParamsLink href="/items/123" currentSearchParams={current}>
  Open
</SearchParamsLink>

// Drop everything
<SearchParamsLink
  href="/items"
  currentSearchParams={current}
  preserve={[]}
>
  Reset
</SearchParamsLink>

// Set / override / clear values
<SearchParamsLink
  href="/items"
  currentSearchParams={current}
  customValues={{ tab: 'observations', page: null }}
>
  Observations
</SearchParamsLink>
```

The `component` prop swaps the underlying Link with full type inference of the new component's props:

```tsx
<SearchParamsLink
  href="/items"
  currentSearchParams={current}
  component={MyStyledLink}
  variant="primary"
>
  Open
</SearchParamsLink>
```

### `<SearchParamsForm>`

GET-method form wrapper. Renders one hidden `<input>` per preserved param.

```tsx
<SearchParamsForm action="/items" currentSearchParams={current}>
  <input type="text" name="q" />
  <button type="submit">Search</button>
</SearchParamsForm>
```

The `component` prop accepts a custom form component. Use `next/form`'s `Form` (Next 15+) for client-side prefetching of GET targets:

```tsx
import Form from 'next/form'

<SearchParamsForm
  action="/items"
  currentSearchParams={current}
  component={Form}
>
  …
</SearchParamsForm>
```

### Re-exports

```tsx
import {
  preserveSearchParams,
  serializeToSearchParams,
} from '@preserve-search-params/next'
import type {
  SearchParamsPreserveOptions,
  SearchParamsValue,
  SearchParamsValues,
} from '@preserve-search-params/next'
```

## Reading the current URL

Where to source `currentSearchParams` depends on context. The components don't care which one you use.

### App Router server component

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

## Imperative navigation, redirects, and other cases

Use `preserveSearchParams` directly with Next.js's existing primitives — no extra wrappers needed.

### `router.push` / `router.replace`

```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { preserveSearchParams } from '@preserve-search-params/next'

function GoSomewhere() {
  const router = useRouter()
  const current = new URLSearchParams(useSearchParams())
  return (
    <button
      onClick={() => {
        const next = preserveSearchParams(current, {
          customValues: { tab: 'observations' },
        }).toString()
        router.push(`/items?${next}`)
      }}
    >
      Go
    </button>
  )
}
```

### Server Action redirect

```ts
'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { preserveSearchParams } from '@preserve-search-params/next'

export async function archiveItem(id: string) {
  // ... mutation
  const referer = (await headers()).get('referer')
  const search = referer
    ? new URL(referer).searchParams
    : new URLSearchParams()
  const next = preserveSearchParams(search, { customValues: { page: null } })
  redirect(`/items?${next}`)
}
```

### `getServerSideProps` redirect (Pages Router)

```ts
import { preserveSearchParams } from '@preserve-search-params/next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const url = new URL(ctx.req.url ?? '/', 'http://x')
  const next = preserveSearchParams(url.searchParams, {
    customValues: { page: null },
  })
  return {
    redirect: { destination: `/items?${next}`, permanent: false },
  }
}
```

### Building a URL string

```ts
const next = preserveSearchParams(current, opts).toString()
const href = `/items?${next}`
```

## License

[MIT](../../LICENSE.md)
