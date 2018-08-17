import HelloType from '../src/hello-type'
import Type from '../src/type'

describe('HelloType', () => {
  describe('helpers', () => {
    test('HelloType.expect.toBe.typeof', () => {
      const NumberType = new Type(Number)
      expect(() => { HelloType.expect(NumberType).toBe.typeof(1) }).not.toThrowError()
      expect(() => { HelloType.expect(NumberType).toBe.typeof(null) }).toThrowError()
    })
    test('HelloType.is.typeof', () => {
      const NumberType = new Type(Number)
      expect(HelloType.is(NumberType).typeof(1)).toBeTruthy()
      expect(HelloType.is(NumberType).typeof('1')).toBeFalsy()
    })
    test('HelloType.catch.by', () => {
      const NumberType = new Type(Number)
      expect(HelloType.catch(1).by(NumberType)).toBeNull()
      expect(HelloType.catch('1').by(NumberType)).toBeInstanceOf(Error)
    })
    test('HelloType.trace.by.with', (done) => {
      const NumberType = new Type(Number)
      HelloType.trace('1').by(NumberType).with((error) => {
        expect(error).toBeInstanceOf(Error)
        done()
      })
    })
  })
})
