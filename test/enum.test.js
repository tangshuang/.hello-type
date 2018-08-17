import Enum from '../src/enum'

describe('Enum', () => {
  describe('assert', () => {
    test('string', () => {
      const EnumType = Enum('red', 'blue', 'yellow')
      expect(() => { EnumType.assert('red') }).not.toThrowError()
      expect(() => { EnumType.assert('black') }).toThrowError()
    })
    test('basic', () => {
      const EnumType = Enum(String, Number)
      expect(() => { EnumType.assert('red') }).not.toThrowError()
      expect(() => { EnumType.assert(10) }).not.toThrowError()
      expect(() => { EnumType.assert(null) }).toThrowError()
    })
  })
  describe('test', () => {
    test('sting', () => {
      const EnumType = Enum('red', 'blue', 'yellow')
      expect(EnumType.test('red')).toBeTruthy()
      expect(EnumType.test('black')).toBeFalsy()
    })
  })
  describe('catch', () => {
    test('basic', () => {
      const EnumType = Enum('red', 'blue', 'yellow')
      expect(EnumType.catch('red')).toBeNull()
      expect(EnumType.catch('black')).toBeInstanceOf(Error)
    })
  })
  describe('trace', () => {
    test('basic', (done) => {
      const EnumType = Enum('red', 'blue', 'yellow')
      EnumType.trace(null).with((error) => {
        expect(error).toBeInstanceOf(Error)
        done()
      })
    })
  })
})
