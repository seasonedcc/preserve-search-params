import { render } from '@testing-library/react'
import type * as React from 'react'
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SearchParamsForm } from './search-params-form'

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

function readHidden(container: HTMLElement) {
  const inputs = container.querySelectorAll<HTMLInputElement>(
    'input[type="hidden"]'
  )
  return Array.from(inputs).map((i) => ({ name: i.name, value: i.value }))
}

describe('SearchParamsForm', () => {
  it('renders hidden inputs preserving all current params', () => {
    const { container } = renderAt(
      '/items?page=2&filter=active',
      <SearchParamsForm action="/items">
        <button type="submit">Go</button>
      </SearchParamsForm>
    )

    const hidden = readHidden(container)
    expect(hidden).toEqual(
      expect.arrayContaining([
        { name: 'page', value: '2' },
        { name: 'filter', value: 'active' },
      ])
    )
  })

  it('defaults method to GET', () => {
    const { container } = renderAt(
      '/items',
      <SearchParamsForm action="/items">child</SearchParamsForm>
    )
    const form = container.querySelector('form')
    expect(form?.getAttribute('method')).toBe('get')
  })

  it('renders one hidden input per repeated key (no de-duplication)', () => {
    const { container } = renderAt(
      '/items?selected[]=1&selected[]=2',
      <SearchParamsForm action="/items">child</SearchParamsForm>
    )

    const hidden = readHidden(container).filter((h) => h.name === 'selected[]')
    expect(hidden).toEqual([
      { name: 'selected[]', value: '1' },
      { name: 'selected[]', value: '2' },
    ])
  })

  it('applies customValues including null clears', () => {
    const { container } = renderAt(
      '/items?page=2&drop=this',
      <SearchParamsForm
        action="/items"
        customValues={{ tab: 'observations', drop: null }}
      >
        child
      </SearchParamsForm>
    )

    const hidden = readHidden(container)
    expect(hidden).toEqual(
      expect.arrayContaining([
        { name: 'page', value: '2' },
        { name: 'tab', value: 'observations' },
      ])
    )
    expect(hidden.find((h) => h.name === 'drop')).toBeUndefined()
  })
})
