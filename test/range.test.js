import Range from '../src/range'

describe('Range', () => {
  describe('assert', () => {
    test('basic', () => {
      const RangeType = Range(0, 1)
      expect(() => { RangeType.assert(0.5) }).not.toThrowError()
      expect(() => { RangeType.assert(0) }).not.toThrowError()
      expect(() => { RangeType.assert(1) }).not.toThrowError()
      expect(() => { RangeType.assert(5) }).toThrowError()
    })
  })
  describe('test', () => {
    test('sting', () => {
      const RangeType = Range(0, 1)
      expect(RangeType.test(0.5)).toBeTruthy()
      expect(RangeType.test(null)).toBeFalsy()
    })
  })
  describe('catch', () => {
    test('basic', () => {
      const RangeType = Range(0, 1)
      expect(RangeType.catch(0.5)).toBeUndefined()
      expect(RangeType.catch(-2)).toBeInstanceOf(Error)
    })
  })
  describe('trace', () => {
    test('basic', (done) => {
      const RangeType = Range(0, 1)
      RangeType.trace(-5).catch((error) => {
        expect(error).toBeInstanceOf(Error)
        done()
      })
    })
  })
})
