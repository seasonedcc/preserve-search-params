import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SearchParamsLink } from './search-params-link'

function renderAt(path: string, ui: React.ReactNode) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Outlet />,
        children: [{ path: '*', element: ui }],
      },
    ],
    { initialEntries: [path] }
  )
  return render(<RouterProvider router={router} />)
}

describe('SearchParamsLink', () => {
  it('preserves all current search params by default', () => {
    renderAt(
      '/items?page=2&filter=active&q=hello',
      <SearchParamsLink to="/items/123">Open</SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    const href = link.getAttribute('href') ?? ''
    const url = new URL(href, 'http://x')

    expect(url.pathname).toBe('/items/123')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('filter')).toBe('active')
    expect(url.searchParams.get('q')).toBe('hello')
  })

  it('drops everything when preserve is empty', () => {
    renderAt(
      '/items?page=2&filter=active',
      <SearchParamsLink to="/items/123" preserve={[]}>
        Open
      </SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    expect(link.getAttribute('href')).toBe('/items/123')
  })

  it('preserves only listed params when preserve is a string array', () => {
    renderAt(
      '/items?page=2&filter=active&q=hello',
      <SearchParamsLink to="/items/123" preserve={['page']}>
        Open
      </SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    const url = new URL(link.getAttribute('href') ?? '', 'http://x')

    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.has('filter')).toBe(false)
    expect(url.searchParams.has('q')).toBe(false)
  })

  it('applies customValues — set, override, and clear', () => {
    renderAt(
      '/items?page=2&tab=info&drop=this',
      <SearchParamsLink
        to="/items/123"
        customValues={{ tab: 'observations', drop: null, sort: 'name' }}
      >
        Open
      </SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    const url = new URL(link.getAttribute('href') ?? '', 'http://x')

    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('tab')).toBe('observations')
    expect(url.searchParams.has('drop')).toBe(false)
    expect(url.searchParams.get('sort')).toBe('name')
  })

  it('serializes nested customValues with bracket notation', () => {
    renderAt(
      '/items',
      <SearchParamsLink
        to="/items/123"
        customValues={{ filter: { status: 'active', tags: ['a', 'b'] } }}
      >
        Open
      </SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    const queryString = (link.getAttribute('href') ?? '').split('?')[1] ?? ''
    const params = new URLSearchParams(queryString)

    expect(params.get('filter[status]')).toBe('active')
    // Nested arrays use indexed bracket notation
    expect(params.get('filter[tags][0]')).toBe('a')
    expect(params.get('filter[tags][1]')).toBe('b')
  })

  it('renders a custom component supplied via the `component` prop', () => {
    type CustomTo = string | { pathname: string; search?: string }
    const CustomLink = React.forwardRef<
      HTMLAnchorElement,
      {
        to: CustomTo
        children?: React.ReactNode
        'data-custom'?: boolean
      }
    >(({ to, children, ...rest }, ref) => {
      const href =
        typeof to === 'string'
          ? to
          : `${to.pathname}${to.search ? `?${to.search}` : ''}`
      return (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      )
    })
    CustomLink.displayName = 'CustomLink'

    renderAt(
      '/items?page=2',
      <SearchParamsLink to="/items/123" component={CustomLink} data-custom>
        Open
      </SearchParamsLink>
    )

    const link = screen.getByRole('link', { name: 'Open' })
    expect(link).toHaveAttribute('data-custom')
    expect(link.getAttribute('href')).toContain('page=2')
  })

  it('attaches a ref to the rendered <a>', () => {
    const ref = React.createRef<HTMLAnchorElement>()
    renderAt(
      '/items',
      <SearchParamsLink to="/items/123" ref={ref}>
        Open
      </SearchParamsLink>
    )
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
  })

  it('forwards a ref through to a custom component', () => {
    type CustomTo = string | { pathname: string; search?: string }
    const CustomLink = React.forwardRef<
      HTMLAnchorElement,
      { to: CustomTo; children?: React.ReactNode }
    >(({ to, children, ...rest }, ref) => {
      const href =
        typeof to === 'string'
          ? to
          : `${to.pathname}${to.search ? `?${to.search}` : ''}`
      return (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      )
    })
    CustomLink.displayName = 'CustomLink'

    const ref = React.createRef<HTMLAnchorElement>()
    renderAt(
      '/items',
      <SearchParamsLink to="/items/123" component={CustomLink} ref={ref}>
        Open
      </SearchParamsLink>
    )
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
  })
})
