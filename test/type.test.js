import Type from '../src/type'

describe('Test Type', () => {
  test('Number', () => {
    const NumberType = new Type(Number)
    expect(() => { NumberType.assert(1) }).not.toThrowError()
    expect(() => { NumberType.assert('error') }).toThrowError()
  })
})