import { describe, expect, it } from 'vitest'
import { redirectPathWithSearchParams } from './redirect-path-with-search-params'

describe('redirectPathWithSearchParams', () => {
  it('preserves all request params by default and merges them onto the path', () => {
    const request = new Request('https://example.com/source?a=1&b=2')
    const result = redirectPathWithSearchParams(request, '/dest')

    expect(result).toBe('/dest?a=1&b=2')
  })

  it('preserves request params with explicit preserve "all" when path has no search', () => {
    const request = new Request('https://example.com/source?a=1&b=2')
    const result = redirectPathWithSearchParams(request, '/dest', {
      preserve: 'all',
    })

    expect(result).toBe('/dest?a=1&b=2')
  })

  it('applies preserve allowlist to request params and drops the rest', () => {
    const request = new Request('https://example.com/source?keep=1&drop=2')
    const result = redirectPathWithSearchParams(request, '/dest', {
      preserve: ['keep'],
    })

    expect(result).toBe('/dest?keep=1')
  })

  it('drops every request param when preserve is an empty array', () => {
    const request = new Request('https://example.com/source?a=1&b=2')
    const result = redirectPathWithSearchParams(request, '/dest', {
      preserve: [],
    })

    expect(result).toBe('/dest')
  })

  it('merges single-value params from the target path', () => {
    const request = new Request('https://example.com/source?a=1')
    const result = redirectPathWithSearchParams(request, '/dest?b=2')

    const params = new URLSearchParams(result.split('?')[1])
    expect(result.startsWith('/dest?')).toBe(true)
    expect(params.get('a')).toBe('1')
    expect(params.get('b')).toBe('2')
  })

  it('lets options.customValues override params present on the target path', () => {
    const request = new Request('https://example.com/source')
    const result = redirectPathWithSearchParams(request, '/dest?foo=path', {
      customValues: { foo: 'override' },
    })

    expect(result).toBe('/dest?foo=override')
  })

  it('preserves the hash from the target path', () => {
    const request = new Request('https://example.com/source?a=1')
    const result = redirectPathWithSearchParams(request, '/dest#section')

    expect(result).toBe('/dest?a=1#section')
  })

  it('handles paths with both search and hash', () => {
    const request = new Request('https://example.com/source?a=1')
    const result = redirectPathWithSearchParams(request, '/dest?b=2#section')

    expect(result.startsWith('/dest?')).toBe(true)
    expect(result.endsWith('#section')).toBe(true)
    const search = result.slice('/dest?'.length, -'#section'.length)
    const params = new URLSearchParams(search)
    expect(params.get('a')).toBe('1')
    expect(params.get('b')).toBe('2')
  })

  it('returns the pathname only when there are no params anywhere', () => {
    const request = new Request('https://example.com/source')
    const result = redirectPathWithSearchParams(request, '/dest')

    expect(result).toBe('/dest')
  })

  it('returns just a query string when the path is empty', () => {
    const request = new Request('https://example.com/source?a=1')
    const result = redirectPathWithSearchParams(request, '')

    expect(result).toBe('?a=1')
  })

  it('preserves repeated keys from the request URL', () => {
    const request = new Request('https://example.com/source?tag=a&tag=b')
    const result = redirectPathWithSearchParams(request, '/dest', {
      preserve: ['tag'],
    })

    const params = new URLSearchParams(result.split('?')[1])
    expect(params.getAll('tag')).toEqual(['a', 'b'])
  })

  it('merges repeated keys from the target path as a customValues array (bracket form)', () => {
    const request = new Request('https://example.com/source')
    const result = redirectPathWithSearchParams(request, '/dest?tag=a&tag=b')

    const params = new URLSearchParams(result.split('?')[1])
    expect(params.getAll('tag[]')).toEqual(['a', 'b'])
    expect(params.has('tag')).toBe(false)
  })

  it('preserves the explicit selected[] bracket form on the target path', () => {
    const request = new Request('https://example.com/source')
    const result = redirectPathWithSearchParams(
      request,
      '/dest?selected[]=1&selected[]=2'
    )

    const params = new URLSearchParams(result.split('?')[1])
    expect(params.getAll('selected[]')).toEqual(['1', '2'])
  })

  it('serializes nested customValues with bracket notation', () => {
    const request = new Request('https://example.com/source')
    const result = redirectPathWithSearchParams(request, '/dest', {
      customValues: {
        filter: { status: 'active' },
        tags: ['urgent', 'review'],
        page: 2,
      },
    })

    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('filter[status]')).toBe('active')
    expect(params.getAll('tags[]')).toEqual(['urgent', 'review'])
    expect(params.get('page')).toBe('2')
  })

  it('clears a request param when options.customValues sets it to null', () => {
    const request = new Request('https://example.com/source?a=1&b=2')
    const result = redirectPathWithSearchParams(request, '/dest', {
      customValues: { a: null },
    })

    expect(result).toBe('/dest?b=2')
  })

  it('combines preserve allowlist with options.customValues', () => {
    const request = new Request(
      'https://example.com/source?keep=1&drop=2&also-drop=3'
    )
    const result = redirectPathWithSearchParams(request, '/dest', {
      preserve: ['keep'],
      customValues: { extra: 'yes' },
    })

    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('keep')).toBe('1')
    expect(params.get('extra')).toBe('yes')
    expect(params.has('drop')).toBe(false)
    expect(params.has('also-drop')).toBe(false)
  })
})
