import HelloType from '../src/hello-type'
import Type from '../src/type'

describe('HelloType', () => {
  describe('helpers', () => {
    beforeAll(() => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })
    afterAll(() => {
      console.error.mockRestore()
    })
    test('HelloType.expect.to.match', () => {
      const NumberType = new Type(Number)
      expect(() => { HelloType.expect(1).to.match(NumberType) }).not.toThrowError()
      expect(() => { HelloType.expect(null).to.match(NumberType) }).toThrowError()
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
    test('HelloType.slient', () => {
      HelloType.slient = true
      const NumberType = new Type(Number)
      expect(() => { HelloType.expect(null).to.match(NumberType) }).not.toThrowError()
      HelloType.slient = false
    })
    test('HelloType.define.by', () => {
      let ObjType = new Type({
        name: String,
        age: Number,
        child: {
          name: String,
          age: Number,
        },
      })
      
      expect(() => { HelloType.define({}).by(ObjType) }).not.toThrowError()
      expect(() => {
        let obj = {
          child: [], // error type
        }
        HelloType.define(obj).by(ObjType)
      }).toThrowError()

      let o
      expect(() => {
        let obj = {
          child: {},
        }
        o = HelloType.define(obj).by(ObjType)
      }).not.toThrowError()
      expect(() => { o.name = 10 }).toThrowError()
      expect(() => { o.name = 'tomy' }).not.toThrowError()
      expect(() => { o.child.name = 10 }).toThrowError()
      expect(() => { o.child.name = 'tomy' }).not.toThrowError()
    })
  })
})
