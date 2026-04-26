# preserve-search-params

A family of small, composable libraries for **preserving URL search params** across navigations and form submissions in web apps. The URL becomes the source of truth for filter, sort, pagination, and tab state, and surviving round-trips between list ↔ detail pages becomes a one-prop affair.

## Why

Building list-heavy CRUD apps where users filter, sort, paginate, click into a detail page, and come back — without losing their place — is tedious without helpers. Most apps end up sacrificing UX because preserving search params manually is too much work.

These libraries make it second nature.

## Packages

| Package | Description |
|---|---|
| [`preserve-search-params`](packages/core) | Core. Zero-dependency, framework-agnostic. A single function: `preserveSearchParams(URLSearchParams, options) → URLSearchParams`. |
| [`@preserve-search-params/react-router`](packages/react-router) | React Router v7+ adapter. `<SearchParamsLink>`, `<SearchParamsForm>`, `useResolvedPathWithSearchParams`. |
| [`@preserve-search-params/next`](packages/next) | Next.js adapter. Pure components for App Router *and* Pages Router, server components *and* client components. |

## Quick taste

```tsx
// React Router
<SearchParamsLink to="/items/123">Open</SearchParamsLink>
// On /items?page=2&filter=active → href becomes /items/123?page=2&filter=active

// Next.js
<SearchParamsLink href="/items/123" currentSearchParams={current}>
  Open
</SearchParamsLink>
```

```ts
// The core, reusable everywhere
import { preserveSearchParams } from 'preserve-search-params'

const next = preserveSearchParams(new URLSearchParams('page=2&filter=active'), {
  customValues: { tab: 'observations', page: null }, // null clears
})
// tab=observations&filter=active
```

## URL-as-state for filter objects

Recursive serialization of nested objects and arrays makes URL-as-state ergonomic for any shape:

```ts
preserveSearchParams(new URLSearchParams(), {
  customValues: {
    filter: { status: 'active', tags: ['urgent', 'review'] },
    page: 2,
  },
}).toString()
// filter%5Bstatus%5D=active&filter%5Btags%5D%5B%5D=urgent&filter%5Btags%5D%5B%5D=review&page=2
```

## Behavior

| `preserve` value | Effect |
|---|---|
| `'all'` *(default)* | Keep every param in the input. |
| `[]` | Drop everything. |
| `['tab', 'q']` | Keep only these. Exact, case-sensitive match. |

`customValues` runs after preservation. It sets, overrides, or — with `null` — clears specific keys. Works recursively for nested objects and arrays.

## Use cases covered

| Case | Mechanism |
|---|---|
| Click a `<Link>` | `<SearchParamsLink>` wrapper (each adapter). |
| Submit a (GET) form | `<SearchParamsForm>` wrapper (each adapter). |
| `router.push` / `router.replace` | Compose the core with your framework's router primitive. |
| Server-side `redirect()` | Compose the core with your framework's redirect primitive. |
| Build a URL string | Use `URLSearchParams.toString()` on the core's return. |

The wrappers exist where there's real boilerplate to hide (reading the URL, computing the new href, rendering hidden inputs). Imperative cases compose the core with whatever your framework already provides — no invented domain language.

## Install

```bash
pnpm add preserve-search-params                         # core only
pnpm add @preserve-search-params/react-router           # React Router apps
pnpm add @preserve-search-params/next                   # Next.js apps
```

Each adapter re-exports the core, so you only need one import path in app code.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm tsc
pnpm lint
```

The monorepo uses pnpm workspaces, Turbo for task orchestration, and Changesets for versioning.

## License

[MIT](LICENSE.md)
