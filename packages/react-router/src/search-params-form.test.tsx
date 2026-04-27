import { render } from '@testing-library/react'
import * as React from 'react'
import {
  Outlet,
  RouterProvider,
  createMemoryRouter,
  useFetcher,
} from 'react-router'
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

  it('attaches a ref to the rendered <form>', () => {
    const ref = React.createRef<HTMLFormElement>()
    renderAt(
      '/items',
      <SearchParamsForm action="/items" ref={ref}>
        child
      </SearchParamsForm>
    )
    expect(ref.current).toBeInstanceOf(HTMLFormElement)
  })

  it('renders a custom form component supplied via `component`', () => {
    const CustomForm = ({
      children,
      'data-custom': dataCustom,
      ...props
    }: React.FormHTMLAttributes<HTMLFormElement> & {
      'data-custom'?: boolean
    }) => (
      <form {...props} data-custom={dataCustom}>
        {children}
      </form>
    )

    const { container } = renderAt(
      '/items?page=2',
      <SearchParamsForm action="/items" component={CustomForm} data-custom>
        child
      </SearchParamsForm>
    )

    expect(container.querySelector('form')).toHaveAttribute('data-custom')
    expect(readHidden(container)).toEqual([{ name: 'page', value: '2' }])
  })

  it('forwards a ref through to a custom component', () => {
    const CustomForm = React.forwardRef<
      HTMLFormElement,
      React.FormHTMLAttributes<HTMLFormElement>
    >(({ children, ...props }, ref) => (
      <form ref={ref} {...props}>
        {children}
      </form>
    ))
    CustomForm.displayName = 'CustomForm'

    const ref = React.createRef<HTMLFormElement>()
    renderAt(
      '/items',
      <SearchParamsForm action="/items" component={CustomForm} ref={ref}>
        child
      </SearchParamsForm>
    )
    expect(ref.current).toBeInstanceOf(HTMLFormElement)
  })

  it('migration: works with component={fetcher.Form} and forwards ref', () => {
    const ref = React.createRef<HTMLFormElement>()

    function Child() {
      const fetcher = useFetcher()
      return (
        <SearchParamsForm
          action="/items"
          component={fetcher.Form}
          ref={ref}
          preserve={[]}
        >
          child
        </SearchParamsForm>
      )
    }

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Outlet />,
          children: [
            {
              path: 'items',
              action: () => null,
              element: <div>items</div>,
            },
            { path: '*', element: <Child /> },
          ],
        },
      ],
      { initialEntries: ['/page?page=2'] }
    )
    const { container } = render(<RouterProvider router={router} />)

    expect(container.querySelector('form')).toBeInstanceOf(HTMLFormElement)
    expect(ref.current).toBeInstanceOf(HTMLFormElement)
    expect(readHidden(container)).toEqual([])
  })
})
