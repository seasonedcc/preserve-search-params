import {
  type SearchParamsPreserveOptions,
  preserveSearchParams,
} from 'preserve-search-params'
import {
  type FetcherWithComponents,
  type FormProps,
  Form as FrameworkForm,
  useLocation,
} from 'react-router'

type SearchParamsFormProps = FormProps &
  SearchParamsPreserveOptions & {
    fetcher?: FetcherWithComponents<unknown>
  }

function SearchParamsForm({
  fetcher,
  preserve,
  customValues,
  children,
  ...props
}: SearchParamsFormProps) {
  const Form = fetcher?.Form ?? FrameworkForm
  const location = useLocation()
  const search = new URLSearchParams(fetcher ? undefined : location.search)
  const inputs: { key: string; value: string }[] = []

  preserveSearchParams(search, { preserve, customValues }).forEach(
    (value, key) => {
      inputs.push({ key, value })
    }
  )

  return (
    <Form method="get" {...props}>
      {inputs.map(({ key, value }, index) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: necessary for repeated-key search params (e.g. order=action&order=asc)
          key={`${key}-${index}`}
          type="hidden"
          name={key}
          value={value}
        />
      ))}
      {children}
    </Form>
  )
}

export { SearchParamsForm }
export type { SearchParamsFormProps }
