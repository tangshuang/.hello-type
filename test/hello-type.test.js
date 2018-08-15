import HelloType from '../src/hello-type'
import Type from '../src/type'

describe('HelloType', () => {
  describe('helpers', () => {
    test('HelloType.expect.toBe.typeof', () => {
      const NumberType = new Type(Number)
      expect(() => { HelloType.expect(NumberType).toBe.typeof(1) }).not.toThrowError()
      expect(() => { HelloType.expect(NumberType).toBe.typeof(null) }).toThrowError()
    })
  })
})
