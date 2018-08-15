import List from '../src/list'

describe('List', () => {
  describe('assert', () => {
    test('basic', () => {
      const ListType = List([String, Number])
      expect(() => { ListType.assert(['tomy', 10]) }).not.toThrowError()
      expect(() => { ListType.assert(['tomy', '10']) }).toThrowError()
      expect(() => { ListType.assert([null, 10]) }).toThrowError()
      expect(() => { ListType.assert(['tomy', 10, 10]) }).not.toThrowError()
      expect(() => { ListType.assert(['tomy', 10, null]) }).toThrowError()
    })
  })
  describe('test', () => {
    test('basic', () => {
      const ListType = List([String, Number])
      expect(ListType.test(['tomy', 10])).toBeTruthy()
      expect(ListType.test(['tomy', 10, null])).toBeFalsy()
    })
  })
  describe('catch', () => {
    test('basic', () => {
      const ListType = List([String, Number])
      expect(ListType.catch(['tomy', 10])).toBeUndefined()
      expect(ListType.catch(['tomy', '10'])).toBeInstanceOf(Error)
    })
  })
  describe('trace', () => {
    test('basic', (done) => {
      const ListType = List([String, Number])
      ListType.trace(['tomy', '10']).catch((error) => {
        expect(error).toBeInstanceOf(Error)
        done()
      })
    })
  })
})
