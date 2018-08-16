import HelloType from '../src/hello-type'
import Type from '../src/type'
import { IfExists } from '../src/rule'

describe('strict mode', () => {
  test('new Type', () => {
    const SomeType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => SomeType.strictly.assert({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => SomeType.strictly.assert({ name: 'tomy', age: 10, height: 170 })).toThrowError()
    expect(() => SomeType.strictly.assert({ name: 'tomy' })).not.toThrowError()
  })
  test('HelloType', () => {
    const SomeType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => HelloType.expect(SomeType).toBe.strictly.typeof({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => HelloType.expect(SomeType).toBe.strictly.typeof({ name: 'tomy', age: 10, height: 170 })).toThrowError()
    expect(() => HelloType.expect(SomeType).toBe.strictly.typeof({ name: 'tomy' })).not.toThrowError()
  })
})