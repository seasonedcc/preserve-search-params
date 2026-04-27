# preserve-search-params

Preserve URL search params across navigations and form submissions.

When a user filters a list, paginates, then clicks into a detail page, the back button should bring them back to exactly what they were looking at. Doing that by hand — threading filters and page numbers through every link, form, redirect, and router push — is enough work that most apps just skip it. The URL becomes lossy, and pagination, filter, sort, and tab state vanish on every navigation.

These libraries fix that. The URL becomes your single source of truth, and one prop keeps it intact across navigations.

## Quick example

The same idea in each adapter:

### React Router

```tsx
// Rendered on /items?page=2&filter=active
<SearchParamsLink to="/items/123">Open</SearchParamsLink>
// → /items/123?page=2&filter=active
```

### Next.js

```tsx
// current = new URLSearchParams('page=2&filter=active')
<SearchParamsLink href="/items/123" currentSearchParams={current}>
  Open
</SearchParamsLink>
// → /items/123?page=2&filter=active
```

## Mental model

Read the current URL once. Hand it to the wrappers. They preserve every param by default, or only the ones you list, and `customValues` sets, overrides, or clears specific keys (including nested objects). Done.

## Pick your adapter

| Package | When to use | Install |
|---|---|---|
| [`@preserve-search-params/react-router`](packages/react-router) | React Router v7+ apps | `pnpm add @preserve-search-params/react-router` |
| [`@preserve-search-params/next`](packages/next) | Next.js apps (App Router and Pages Router) | `pnpm add @preserve-search-params/next` |
| [`preserve-search-params`](packages/core) | Anything else, or when composing manually | `pnpm add preserve-search-params` |

Each adapter re-exports the core, so you only need one import path in app code.

## Behavior at a glance

| `preserve` value | Effect |
|---|---|
| `'all'` *(default)* | Keep every param in the input. |
| `[]` | Drop everything. |
| `['tab', 'q']` | Keep only these. Exact, case-sensitive match. |

`customValues` runs after preservation. It sets, overrides, or clears specific keys (set a key to `null` to clear). Recursive for nested objects and arrays.

## URL-as-state for filter objects

Recursive serialization makes the URL a viable home for any filter shape, not just flat key-value pairs:

```ts
preserveSearchParams(new URLSearchParams(), {
  customValues: {
    filter: { status: 'active', tags: ['urgent', 'review'] },
    page: 2,
  },
}).toString()
// filter%5Bstatus%5D=active&filter%5Btags%5D%5B%5D=urgent&filter%5Btags%5D%5B%5D=review&page=2
```

Decoded for readability:

```
filter[status]=active
filter[tags][]=urgent
filter[tags][]=review
page=2
```

URL state stays in the URL, even when your filter shape grows. No client-side store, no server-side session blob, no extra round-trip.

## Use cases covered

| Situation | React Router | Next.js |
|---|---|---|
| Click a `<Link>` | `<SearchParamsLink>` (auto-reads URL) | `<SearchParamsLink>` + `currentSearchParams` |
| Submit a GET form | `<SearchParamsForm>` | `<SearchParamsForm>` + `currentSearchParams` |
| `useNavigate` / `router.push` | `useResolvedPathWithSearchParams` | `preserveSearchParams(...).toString()` |
| Server-side `redirect()` | `preserveSearchParams(new URL(request.url).searchParams).toString()` | Same shape, against the request you have |
| Build a URL string | `preserveSearchParams(...).toString()` | `preserveSearchParams(...).toString()` |

The wrappers exist where there's real boilerplate to hide (reading the URL, computing the new href, rendering hidden inputs). For everything else, the core function composes cleanly with whatever your framework already provides.

## Who built this

Built by [Seasoned](https://seasoned.cc). We extracted it from our internal app framework after writing the same preservation logic too many times, and pulled it out so we (and you) stop writing it from scratch.

## License

[MIT](LICENSE.md)
