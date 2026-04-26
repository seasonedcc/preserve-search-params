import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { SearchParamsLink } from './search-params-link'

describe('SearchParamsLink', () => {
  it('preserves all current search params by default', () => {
    const current = new URLSearchParams('page=2&filter=active&q=hello')
    render(
      <SearchParamsLink href="/items/123" currentSearchParams={current}>
        Open
      </SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    const url = new URL(link.getAttribute('href') ?? '', 'http://x')

    expect(url.pathname).toBe('/items/123')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('filter')).toBe('active')
    expect(url.searchParams.get('q')).toBe('hello')
  })

  it('drops everything when preserve is empty', () => {
    const current = new URLSearchParams('page=2&filter=active')
    render(
      <SearchParamsLink
        href="/items/123"
        currentSearchParams={current}
        preserve={[]}
      >
        Open
      </SearchParamsLink>
    )

    expect(
      screen.getByRole('link', { name: 'Open' }).getAttribute('href')
    ).toBe('/items/123')
  })

  it('preserves only listed params', () => {
    const current = new URLSearchParams('page=2&filter=active&q=hello')
    render(
      <SearchParamsLink
        href="/items/123"
        currentSearchParams={current}
        preserve={['page']}
      >
        Open
      </SearchParamsLink>
    )

    const url = new URL(
      screen.getByRole('link', { name: 'Open' }).getAttribute('href') ?? '',
      'http://x'
    )
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.has('filter')).toBe(false)
  })

  it('applies customValues — set, override, and clear', () => {
    const current = new URLSearchParams('page=2&tab=info&drop=this')
    render(
      <SearchParamsLink
        href="/items/123"
        currentSearchParams={current}
        customValues={{ tab: 'observations', drop: null, sort: 'name' }}
      >
        Open
      </SearchParamsLink>
    )

    const url = new URL(
      screen.getByRole('link', { name: 'Open' }).getAttribute('href') ?? '',
      'http://x'
    )
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('tab')).toBe('observations')
    expect(url.searchParams.has('drop')).toBe(false)
    expect(url.searchParams.get('sort')).toBe('name')
  })

  it('serializes nested customValues with bracket notation', () => {
    const current = new URLSearchParams()
    render(
      <SearchParamsLink
        href="/items/123"
        currentSearchParams={current}
        customValues={{ filter: { status: 'active', tags: ['a', 'b'] } }}
      >
        Open
      </SearchParamsLink>
    )

    const queryString =
      (
        screen.getByRole('link', { name: 'Open' }).getAttribute('href') ?? ''
      ).split('?')[1] ?? ''
    const params = new URLSearchParams(queryString)

    expect(params.get('filter[status]')).toBe('active')
    expect(params.get('filter[tags][0]')).toBe('a')
    expect(params.get('filter[tags][1]')).toBe('b')
  })

  it('appends to existing href query string', () => {
    const current = new URLSearchParams('page=2')
    render(
      <SearchParamsLink href="/items?fixed=yes" currentSearchParams={current}>
        Open
      </SearchParamsLink>
    )

    const url = new URL(
      screen.getByRole('link', { name: 'Open' }).getAttribute('href') ?? '',
      'http://x'
    )
    expect(url.searchParams.get('fixed')).toBe('yes')
    expect(url.searchParams.get('page')).toBe('2')
  })

  it('renders a custom component supplied via the `component` prop', () => {
    const CustomLink = React.forwardRef<
      HTMLAnchorElement,
      {
        href: string
        children?: React.ReactNode
        'data-custom'?: boolean
      }
    >(({ href, children, ...rest }, ref) => (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    ))
    CustomLink.displayName = 'CustomLink'

    const current = new URLSearchParams('page=2')
    render(
      <SearchParamsLink
        href="/items/123"
        currentSearchParams={current}
        component={CustomLink}
        data-custom
      >
        Open
      </SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    expect(link).toHaveAttribute('data-custom')
    expect(link.getAttribute('href')).toContain('page=2')
  })
})
