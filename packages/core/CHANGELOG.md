# preserve-search-params

## 0.1.0

### Minor Changes

- Initial public release.

  `preserve-search-params` is a zero-dependency, framework-agnostic primitive for preserving URL search params across navigations and form submissions. It exposes `preserveSearchParams`, `redirectPathWithSearchParams`, and `serializeToSearchParams`, with recursive bracket-notation serialization for nested filter objects.

  `@preserve-search-params/react-router` is the React Router v7+ adapter. It ships `<SearchParamsLink>` and `<SearchParamsForm>` (both polymorphic via the `component` prop), the `useResolvedPathWithSearchParams` hook, and `redirectPathWithSearchParams` for loaders and actions. Peer deps: `react >=19`, `react-router >=7`.

  `@preserve-search-params/next` is the Next.js adapter for App Router and Pages Router. It ships `<SearchParamsLink>` and `<SearchParamsForm>` (both polymorphic via the `component` prop, e.g. `next/form`'s `Form`) and re-exports the core helpers. Components are pure (no `'use client'`), so the same component works in server components, client components, and Pages Router. Peer deps: `react >=19`, `next >=14`.
