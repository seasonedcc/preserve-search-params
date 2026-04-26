import { describe, expect, it } from 'vitest'
import { preserveSearchParams } from './preserve-search-params'

describe('preserveSearchParams', () => {
  describe('nested objects', () => {
    it('serializes simple nested object', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { myObject: { myKey: 'myValue' } },
      })

      expect(result.get('myObject[myKey]')).toBe('myValue')
    })

    it('serializes deeply nested objects', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          level1: {
            level2: {
              level3: 'deep',
            },
          },
        },
      })

      expect(result.get('level1[level2][level3]')).toBe('deep')
    })

    it('serializes object with multiple keys', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          user: {
            id: 123,
            name: 'John',
            email: 'john@example.com',
          },
        },
      })

      expect(result.get('user[id]')).toBe('123')
      expect(result.get('user[name]')).toBe('John')
      expect(result.get('user[email]')).toBe('john@example.com')
    })

    it('filters out null values in objects', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          obj: {
            present: 'value',
            absent: null,
          },
        },
      })

      expect(result.get('obj[present]')).toBe('value')
      expect(result.has('obj[absent]')).toBe(false)
    })
  })

  describe('arrays with indexed notation', () => {
    it('serializes array of strings with unindexed brackets', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { myArray: ['value1', 'value2'] },
      })

      expect(result.getAll('myArray[]')).toEqual(['value1', 'value2'])
    })

    it('serializes array of numbers with unindexed brackets', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { numbers: [1, 2, 3] },
      })

      expect(result.getAll('numbers[]')).toEqual(['1', '2', '3'])
    })

    it('serializes array of booleans with unindexed brackets', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { flags: [true, false, true] },
      })

      expect(result.getAll('flags[]')).toEqual(['true', 'false', 'true'])
    })

    it('filters out null values in arrays', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { mixed: ['a', null, 'b'] },
      })

      expect(result.getAll('mixed[]')).toEqual(['a', 'b'])
    })
  })

  describe('arrays of objects', () => {
    it('serializes array of objects', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          items: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
        },
      })

      expect(result.get('items[0][id]')).toBe('1')
      expect(result.get('items[0][name]')).toBe('A')
      expect(result.get('items[1][id]')).toBe('2')
      expect(result.get('items[1][name]')).toBe('B')
    })

    it('serializes array of nested objects', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          users: [
            { profile: { name: 'Alice', age: 30 } },
            { profile: { name: 'Bob', age: 25 } },
          ],
        },
      })

      expect(result.get('users[0][profile][name]')).toBe('Alice')
      expect(result.get('users[0][profile][age]')).toBe('30')
      expect(result.get('users[1][profile][name]')).toBe('Bob')
      expect(result.get('users[1][profile][age]')).toBe('25')
    })
  })

  describe('nested arrays', () => {
    it('serializes array of arrays', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          data: [
            [1, 2],
            [3, 4],
          ],
        },
      })

      expect(result.get('data[0][0]')).toBe('1')
      expect(result.get('data[0][1]')).toBe('2')
      expect(result.get('data[1][0]')).toBe('3')
      expect(result.get('data[1][1]')).toBe('4')
    })

    it('serializes deeply nested arrays', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          matrix: [[[1, 2]], [[3, 4]]],
        },
      })

      expect(result.get('matrix[0][0][0]')).toBe('1')
      expect(result.get('matrix[0][0][1]')).toBe('2')
      expect(result.get('matrix[1][0][0]')).toBe('3')
      expect(result.get('matrix[1][0][1]')).toBe('4')
    })
  })

  describe('explicit empty-bracket keys', () => {
    it('preserves selected[] pattern with empty brackets', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { 'selected[]': ['1', '2', '3'] },
      })

      expect(result.getAll('selected[]')).toEqual(['1', '2', '3'])
    })

    it('does not add indexes to keys ending with []', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { 'tags[]': ['tag1', 'tag2'] },
      })

      const allTags = result.getAll('tags[]')
      expect(allTags).toEqual(['tag1', 'tag2'])
      expect(result.has('tags[0]')).toBe(false)
    })
  })

  describe('mixed types', () => {
    it('handles combination of primitives, objects, and arrays', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: {
          page: 1,
          filter: { status: 'active', role: 'admin' },
          tags: ['a', 'b'],
          selected: [{ id: 1 }, { id: 2 }],
        },
      })

      expect(result.get('page')).toBe('1')
      expect(result.get('filter[status]')).toBe('active')
      expect(result.get('filter[role]')).toBe('admin')
      expect(result.getAll('tags[]')).toEqual(['a', 'b'])
      expect(result.get('selected[0][id]')).toBe('1')
      expect(result.get('selected[1][id]')).toBe('2')
    })
  })

  describe('preserve existing search params', () => {
    it('preserves all params by default', () => {
      const search = new URLSearchParams(
        'page=2&per-page=50&filter=active&q=hello'
      )
      const result = preserveSearchParams(search)

      expect(result.get('page')).toBe('2')
      expect(result.get('per-page')).toBe('50')
      expect(result.get('filter')).toBe('active')
      expect(result.get('q')).toBe('hello')
    })

    it('combines preserved params with custom values', () => {
      const search = new URLSearchParams('page=2')
      const result = preserveSearchParams(search, {
        customValues: { filter: { status: 'active' } },
      })

      expect(result.get('page')).toBe('2')
      expect(result.get('filter[status]')).toBe('active')
    })

    it('preserves selected[] from existing search', () => {
      const search = new URLSearchParams()
      search.append('selected[]', '1')
      search.append('selected[]', '2')

      const result = preserveSearchParams(search)

      expect(result.getAll('selected[]')).toEqual(['1', '2'])
    })

    it('preserves all params when preserve is "all"', () => {
      const search = new URLSearchParams(
        'page=1&custom=value&another=test&foo[bar]=baz'
      )
      const result = preserveSearchParams(search, { preserve: 'all' })

      expect(result.get('page')).toBe('1')
      expect(result.get('custom')).toBe('value')
      expect(result.get('another')).toBe('test')
      expect(result.get('foo[bar]')).toBe('baz')
    })

    it('preserves nothing when preserve is an empty array', () => {
      const search = new URLSearchParams('page=1&custom=value')
      const result = preserveSearchParams(search, { preserve: [] })

      expect(result.toString()).toBe('')
    })

    it('preserves only listed params when preserve is a string array', () => {
      const search = new URLSearchParams('page=1&custom=value&other=ignored')
      const result = preserveSearchParams(search, {
        preserve: ['page', 'custom'],
      })

      expect(result.get('page')).toBe('1')
      expect(result.get('custom')).toBe('value')
      expect(result.has('other')).toBe(false)
    })

    it('matches preserve names exactly (case-sensitive, no fuzzy)', () => {
      const search = new URLSearchParams('per-page=50&perPage=20&PAGE=10')
      const result = preserveSearchParams(search, {
        preserve: ['per-page'],
      })

      expect(result.get('per-page')).toBe('50')
      expect(result.has('perPage')).toBe(false)
      expect(result.has('PAGE')).toBe(false)
    })

    it('combines preserve string[] with customValues', () => {
      const search = new URLSearchParams('page=2&drop=this')
      const result = preserveSearchParams(search, {
        preserve: ['page'],
        customValues: { tab: 'observations' },
      })

      expect(result.get('page')).toBe('2')
      expect(result.get('tab')).toBe('observations')
      expect(result.has('drop')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles empty object', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { empty: {} },
      })

      expect(result.toString()).toBe('')
    })

    it('handles empty array', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { empty: [] },
      })

      expect(result.toString()).toBe('')
    })

    it('handles null value', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { nullable: null },
      })

      expect(result.has('nullable')).toBe(false)
    })

    it('clears an existing param when customValues sets it to null', () => {
      const search = new URLSearchParams('page=2&drop=this')
      const result = preserveSearchParams(search, {
        customValues: { drop: null },
      })

      expect(result.get('page')).toBe('2')
      expect(result.has('drop')).toBe(false)
    })

    it('converts numbers to strings', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { num: 42, nested: { count: 100 } },
      })

      expect(result.get('num')).toBe('42')
      expect(result.get('nested[count]')).toBe('100')
    })

    it('converts booleans to strings', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { flag: true, nested: { enabled: false } },
      })

      expect(result.get('flag')).toBe('true')
      expect(result.get('nested[enabled]')).toBe('false')
    })

    it('handles empty string values', () => {
      const search = new URLSearchParams()
      const result = preserveSearchParams(search, {
        customValues: { empty: '', nested: { str: '' } },
      })

      expect(result.get('empty')).toBe('')
      expect(result.get('nested[str]')).toBe('')
    })
  })

  describe('customValues replace existing params (no duplication)', () => {
    it('replaces simple existing param with new value', () => {
      const search = new URLSearchParams('id=123')
      const result = preserveSearchParams(search, {
        preserve: 'all',
        customValues: { id: '456' },
      })

      expect(result.get('id')).toBe('456')
      expect(result.getAll('id')).toEqual(['456'])
    })

    it('replaces simple existing param with complex object', () => {
      const search = new URLSearchParams('filter=old')
      const result = preserveSearchParams(search, {
        preserve: 'all',
        customValues: { filter: { name: 'john', age: 25 } },
      })

      expect(result.has('filter')).toBe(false)
      expect(result.get('filter[name]')).toBe('john')
      expect(result.get('filter[age]')).toBe('25')
      expect(result.toString()).toBe('filter%5Bname%5D=john&filter%5Bage%5D=25')
    })

    it('replaces complex existing params with new complex object', () => {
      const search = new URLSearchParams()
      search.append('filter[name]', 'oldName')
      search.append('filter[age]', '24')

      const result = preserveSearchParams(search, {
        preserve: 'all',
        customValues: { filter: { name: 'john', age: 25 } },
      })

      expect(result.get('filter[name]')).toBe('john')
      expect(result.get('filter[age]')).toBe('25')
      expect(result.getAll('filter[name]')).toEqual(['john'])
      expect(result.getAll('filter[age]')).toEqual(['25'])
    })

    it('replaces simple existing param with array', () => {
      const search = new URLSearchParams('tags=old')
      const result = preserveSearchParams(search, {
        preserve: 'all',
        customValues: { tags: ['new1', 'new2'] },
      })

      expect(result.has('tags')).toBe(false)
      expect(result.getAll('tags[]')).toEqual(['new1', 'new2'])
      expect(result.toString()).toBe('tags%5B%5D=new1&tags%5B%5D=new2')
    })
  })
})
