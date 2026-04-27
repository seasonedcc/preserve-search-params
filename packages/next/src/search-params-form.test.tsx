import { render } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { SearchParamsForm } from './search-params-form'

function readHidden(container: HTMLElement) {
  const inputs = container.querySelectorAll<HTMLInputElement>(
    'input[type="hidden"]'
  )
  return Array.from(inputs).map((i) => ({ name: i.name, value: i.value }))
}

describe('SearchParamsForm', () => {
  it('renders hidden inputs preserving all current params', () => {
    const current = new URLSearchParams('page=2&filter=active')
    const { container } = render(
      <SearchParamsForm action="/items" currentSearchParams={current}>
        <button type="submit">Go</button>
      </SearchParamsForm>
    )

    expect(readHidden(container)).toEqual(
      expect.arrayContaining([
        { name: 'page', value: '2' },
        { name: 'filter', value: 'active' },
      ])
    )
  })

  it('defaults method to GET', () => {
    const current = new URLSearchParams()
    const { container } = render(
      <SearchParamsForm action="/items" currentSearchParams={current}>
        child
      </SearchParamsForm>
    )
    expect(container.querySelector('form')?.getAttribute('method')).toBe('get')
  })

  it('renders one hidden input per repeated key', () => {
    const current = new URLSearchParams()
    current.append('selected[]', '1')
    current.append('selected[]', '2')

    const { container } = render(
      <SearchParamsForm action="/items" currentSearchParams={current}>
        child
      </SearchParamsForm>
    )

    const hidden = readHidden(container).filter((h) => h.name === 'selected[]')
    expect(hidden).toEqual([
      { name: 'selected[]', value: '1' },
      { name: 'selected[]', value: '2' },
    ])
  })

  it('applies customValues including null clears', () => {
    const current = new URLSearchParams('page=2&drop=this')
    const { container } = render(
      <SearchParamsForm
        action="/items"
        currentSearchParams={current}
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

  it('renders a custom form component when supplied', () => {
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

    const current = new URLSearchParams('page=2')
    const { container } = render(
      <SearchParamsForm
        action="/items"
        currentSearchParams={current}
        component={CustomForm}
        data-custom
      >
        child
      </SearchParamsForm>
    )

    expect(container.querySelector('form')).toHaveAttribute('data-custom')
    expect(readHidden(container)).toEqual([{ name: 'page', value: '2' }])
  })

  it('attaches a ref to the rendered <form>', () => {
    const ref = React.createRef<HTMLFormElement>()
    const current = new URLSearchParams()
    render(
      <SearchParamsForm action="/items" currentSearchParams={current} ref={ref}>
        child
      </SearchParamsForm>
    )
    expect(ref.current).toBeInstanceOf(HTMLFormElement)
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
    const current = new URLSearchParams()
    render(
      <SearchParamsForm
        action="/items"
        currentSearchParams={current}
        component={CustomForm}
        ref={ref}
      >
        child
      </SearchParamsForm>
    )
    expect(ref.current).toBeInstanceOf(HTMLFormElement)
  })
})
