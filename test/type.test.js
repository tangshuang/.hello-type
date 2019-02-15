import Type from '../src/type'

describe('new Type', () => {
  describe('assert', () => {
    test('Number', () => {
      const NumberType = new Type(Number)
      expect(() => { NumberType.assert(1) }).not.toThrowError()
      expect(() => { NumberType.assert('123') }).toThrowError()
      expect(() => { NumberType.assert(NaN) }).toThrowError()
      expect(() => { NumberType.assert(Infinity) }).toThrowError()
      expect(() => { NumberType.assert(new Number(1)) }).toThrowError()
    })
    test('Array', () => {
      const ArrayType = new Type(Array)
      expect(() => { ArrayType.assert([]) }).not.toThrowError()
      expect(() => { ArrayType.assert(null) }).toThrowError()
    })
    test('custom class', () => {
      class MyClass {}
      const MyType = new Type(MyClass)
      const instance = new MyClass()
      expect(() => { MyType.assert(instance) }).not.toThrowError()
      expect(() => { MyType.assert(null) }).toThrowError()
    })
    test('object (Dict)', () => {
      const DictType = new Type({
        name: String,
        age: Number,
      })
      expect(() => { DictType.assert(null) }).toThrowError()
      expect(() => {
        DictType.assert({
          name: 'tomy',
          age: 10,
        })
      }).not.toThrowError()
      expect(() => {
        DictType.assert({
          name: null,
          age: 10,
        })
      }).toThrowError()
    })
    test('array (List)', () => {
      const ListType = new Type([String, Number])
      expect(() => { ListType.assert(null) }).toThrowError()
      expect(() => { ListType.assert(['123', 123]) }).not.toThrowError()
      expect(() => { ListType.assert([123, 123]) }).toThrowError()
      expect(() => { ListType.assert(['123', '123']) }).toThrowError()
      expect(() => { ListType.assert(['123', 123, 10]) }).not.toThrowError()
      expect(() => { ListType.assert(['123', 123, '10']) }).not.toThrowError()
      expect(() => { ListType.assert(['123', 123, null]) }).toThrowError()
    })
    test('nested object', () => {
      const RootType = new Type({
        name: String,
        sub: {
          name: String,
        },
      })
      expect(() => {
        RootType.assert({
          name: 'tomy',
          sub: {
            name: 'lily',
          },
        })
      }).not.toThrowError()
      expect(() => {
        RootType.assert({
          name: 'tomy',
          sub: {
            age: 10, // there is no `name` property
          },
        })
      }).toThrowError()
    })
    test('equal', () => {
      const MyType = new Type('value')
      expect(() => { MyType.assert('value') }).not.toThrowError()
      expect(() => { MyType.assert('not') }).toThrowError()
    })
  })
  describe('test', () => {
    test('object', () => {
      const DictType = new Type({
        name: String,
        age: Number,
      })
      expect(DictType.test({
        name: null,
        age: 10,
      })).toBeFalsy()
      expect(DictType.test({
        name: 'tomy',
        age: 10,
      })).toBeTruthy()
    })
  })
  describe('catch', () => {
    test('Number', () => {
      const NumberType = new Type(Number)
      expect(NumberType.catch(1)).toBeNull()
      expect(NumberType.catch('')).toBeInstanceOf(Error)
    })
  })
  describe('trace', () => {
    test('Number', (done) => {
      const NumberType = new Type(Number)
      NumberType.trace('').with((e) => {
        expect(e).toBeInstanceOf(Error)
        done()
      })
    })
  })
})
