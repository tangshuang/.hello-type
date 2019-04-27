import Tuple from '../src/tuple'

xdescribe('Tuple', () => {
  describe('assert', () => {
    test('basic', () => {
      const TupleType = Tuple(String, Number)
      expect(() => { TupleType.assert('name', 10) }).not.toThrowError()
      expect(() => { TupleType.assert('name', null) }).toThrowError()
    })
  })
  describe('test', () => {
    test('basic', () => {
      const TupleType = Tuple(String, Number)
      expect(TupleType.test('name', 10)).toBeTruthy()
      expect(TupleType.test('name', null)).toBeFalsy()
    })
  })
  describe('catch', () => {
    test('basic', () => {
      const TupleType = Tuple(String, Number)
      expect(TupleType.catch('name', 10)).toBeNull()
      expect(TupleType.catch('name', null)).toBeInstanceOf(Error)
    })
  })
  describe('trace', () => {
    test('basic', (done) => {
      const TupleType = Tuple(String, Number)
      TupleType.trace(null).with((error) => {
        expect(error).toBeInstanceOf(Error)
        done()
      })
    })
  })
})
