import Dict from '../src/dict'

describe('Dict', () => {
  describe('assert', () => {
    test('one level object', () => {
      const DictType = Dict({
        name: String,
        age: Number,
      })
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
    test('nested object', () => {
      const DictType = Dict({
        name: String,
        age: Number,
        parents: {
          father: Object,
          mother: Object,
        },
      })
      expect(() => { 
        DictType.assert({
          name: 'tomy',
          age: 10,
          parents: {
            father: {},
            mother: {},
          },
        }) 
      }).not.toThrowError()
      expect(() => { 
        DictType.assert({
          name: 'tomy',
          age: 10,
          parents: {
            father: {},
          },
        }) 
      }).toThrowError()
    })
    test('nested Dict', () => {
      const DictType = Dict({
        name: String,
        age: Number,
        parents: Dict({
          father: Object,
          mother: Object,
        }),
      })
      expect(() => { 
        DictType.assert({
          name: 'tomy',
          age: 10,
          parents: {
            father: {},
            mother: {},
          },
        }) 
      }).not.toThrowError()
      expect(() => { 
        DictType.assert({
          name: 'tomy',
          age: 10,
          parents: {
            father: {},
          },
        }) 
      }).toThrowError()
    })
  })
  describe('test', () => {
    test('nested object', () => {
      const DictType = Dict({
        name: String,
        age: Number,
        parents: {
          father: Object,
          mother: Object,
        },
      })
      expect(DictType.test({
        name: 'tomy',
        age: 10,
        parents: {
          father: {},
          mother: {},
        },
      })).toBeTruthy()
      expect(DictType.test({
        name: 'tomy',
        age: 10,
        parents: {
          father: {},
        },
      })).toBeFalsy()
    })
  })
  describe('catch', () => {
    test('nested object', () => {
      const DictType = Dict({
        name: String,
        age: Number,
        parents: {
          father: Object,
          mother: Object,
        },
      })
      expect(DictType.catch({
        name: 'tomy',
        age: 10,
        parents: {
          father: {},
          mother: {},
        },
      })).toBeUndefined()
      expect(DictType.catch({
        name: 'tomy',
        age: 10,
        parents: {
          father: {},
        },
      })).toBeInstanceOf(Error)
    })
  })
  describe('trace', () => {
    test('nested object', (done) => {
      const DictType = Dict({
        name: String,
        age: Number,
        parents: {
          father: Object,
          mother: Object,
        },
      })
      DictType.trace({
        name: 'tomy',
        age: 10,
        parents: {
          father: {},
        },
      }).with((error) => {
        expect(error).toBeInstanceOf(Error)
        done()
      })
    })
  })
})
