HelloType
=========

An ECMAScript data type check library.

【[中文文档](https://www.tangshuang.net/5625.html)】

## Install

```
npm i -S hello-type
```

## Usage

```js
import HelloType, { Dict, Enum, Tuple, List, Type, Rule, Self, IfExists } from 'hello-type'
```

or

```js
const { Dict, Enum, Tuple, List, Type, Rule, Self, HelloType, IfExists } = require('hello-type')
```

## Type

To define a type of data, you can use `Type`. It is a class.

```js
const PersonType = new Type({
  name: String,
  age: Number,
  male: Boolean,
  body: {
    head: HeadType, // HeadType is another custom type made of `Type`
    neck: NeckType,
    foot: FootType,
  },
  friends: [FriendType],
  familyCount: Enum(3, 4, 5), // use `Enum()` to make a Enum type
})
```

Then use this data type to check a data:

```js
function welcome(person) {
  PersonType.assert(person) // If the param `person` not match PersonType, an error will be thrown out
}
```

Rules:

- String
- Number: should be a finite number, `NaN` `"123"` and `Infinity` will not match
- Boolean: should be one of `true` or `false`
- Object: should be a normal object like `{}`, instance of class, array and Object self will not match
- Array
- Function
- RegExp
- Symbol
- NaN
- Infinity
- Date
- Promise
- Dict()
- List()
- Enum()
- Tuple()
- new Type
- Null
- Undefined
- Any
- IfExists()
- InstanceOf()
- Equal()
- new Rule
- *: any value to equal

A type instance have members:

**assert(...args)**

Assert whether the args match the type.
If not match, it will use `throw TypeError` to break the program.
Return undefined.

**test(...args)**

Assert whether the args match the type.
Return true if match, return false if not match.

**catch(...args)**

Assert whether the args match the type.
Return null if match, and return error object if not match.

```js
let error = PersonType.catch(person)
```

If there is no error, `null` will be returned.

**trace(...args).with(fn)**

Assert whether the args match the type.
It will run completely asynchronously.
If not match, `fn` will run. You can do like:

```js
PersonType.trace(person).with((error) => console.log(error))
```

`fn` has three parameters:

- error: the catched error, if pass, it will be undefined
- args: array, targets to match
- type: which type be used to match

```js
PersonType.trace(person).with((error, [person], type) => {
  if (error) {
    console.log(person, 'not match', type, 'error:', error)
  }
})
```

It will return a resolved promise anyway:

```js
let error = await PersonType.trace(person).with(fn)
if (error) {
  // ...
}
```

**track(...args).with(fn)**

The difference between trace and track is: `trace` will run assert action completely asynchronously, `track` will run assert action synchronously, and run `fn` asynchronously.

```js
const SomeType = Dict({
  name: String,
  age: Number,
})
const some = {
  name: 'tomy',
  age: 10,
}

SomeType.trace(some).with((error) => console.log(1, error))
SomeType.track(some).with((error) => console.log(2, error))

some.age = null

// => 2 null
// => 1 TypeError
```

As you see, track will be run at the point it placed, trace will be run asynchronously.

**toBeStrict()/strict/Strict**

Whether use strict mode, default mode is false. If you use strict mode, object properties count should match, array length should match, even you use `IfExists`.

```js
const MyType = new Type([Number, Number])
MyType.Strict.assert([1]) // array length should be 2, but here just passed only one
```

```js
const MyType = new Type({
  name: String,
  age: Number,
})
MyType.Strict.assert({
  name: 'tomy',
  age: 10,
  height: 172, // this property is not defined in type, so assert will throw an error
})
MyType.toBeStrict().assert({
  name: 'tomy',
  age: 10,
  height: 172,
})
```

However, `MyType.Strict` is different from `MyType.toBeStrict()`, `.toBeStrict()` is to covert current instance to be in strict mode, but `.Strict` or `.strict` will get a _new_ instance which is in strict mode. If you want to use a type container instance only one in strict mode, you can use `.toBeStrict()`, if you want to use multiple times, use `.Strict` instead.

```js
const MyType = new Type({
  body: Dict({
    head: Object,
  }).toBeStrict(), // here I will use Dict directly in strict mode
})
```

## Dict

A Dict is a type of object which has only one level properties.

- @type function
- @param object
- @return an instance of `Type`

```js
const DictType = Dict({
  name: String,
  age: Number,
})
```

You can pass nested object, but are recommended to use another Dict instead:

```js
const BodyType = Dict({
  head: Object,
  foot: Object,
})
const PersonType = Dict({
  name: String,
  age: Number,
  body: BodyType,
})
```

_What's the difference between Dict and Object?_

An Object match any structure of object. However, a Dict match certain structure of object.

_What's the difference between Dict and new Type?_

- _Dict_ receive only one parameter.
- _Dict_ only receive object, _new Type_ receive any.
- If you pass only one object into _new Type_, they are the same.

## List

A list is an array in which each item has certain structure.

- @type function
- @param array
- @return an instance of `Type`

```js
const ListType = List([String, Number])
```

The pending verify array's items should be right data type as the given order.
If the array length is longer than the rule's length, the overflow ones should be one of these rules.
For example, the 3th item should be Enum(String, Number):

```js
ListType.test(['string', 1, 'str']) // true
ListType.test(['string', 1, 2]) // true
ListType.test(['string', 1, {}]) // false
```

_What's the difference between List and Array?_

An Array match any structure for its item. However, a List match certain structure for each item.

_What's the difference between List and Tuple?_

Tuple has no relation with array, it is a group of scattered items with certain order.

## Tuple

A tuple is a group of scattered items with certain order, the length of tuple can not be changed, each item can have different structure.

- @type function
- @params any
- @return an instance of `Type`

```js
const ParamsType = Tuple(Object, Number, String)
ParamsType.assert({}, 1, 'ok')
```

_What's the difference between Tuple and new Type?_

Tuple can use `IfExists` at the end of parameters, so that you can assert less arguments. However _new Type_ assert method should must receive given count of arguments:

```js
const ParamsType = Tuple(Object, IfExists(Number), IfExists(String))
ParamsType.test({}, 1) // true

const SomeType = Tuple(Object, IfExists(Number), IfExists(String))
SomeType.test({}, 1) // false, arguments length not match
```

## Enum

A enum is a set of values from which the given value should pick.

- @type function
- @params any
- @return an instance of `Type`


```js
const ColorType = Enum('red', 'white', 'green')
ColorType.test('black') // false
```

```js
const ColorType = Enum(String, Number)
ColorType.test('black') // true
ColorType.test(2) // true
ColorType.test([]) // false
```

## Range

A range is a threshold of numbers. The given value should be a nunmber and in the range.

- @type function
- @params number, only two
- @return an instance of `Type`

```js
const RangeType = Range(0, 1)
RangeType.test(0.5) // true
RangeType.test(3) // false
RangeType.test(0) // true, 0 and 1 is in range
```

## Rule

Create a custom rule:

```js
const CustomRule = new Rule(function(value) {
  if (value !== 'ok') {
    return new _ERROR_(value + ' not equal `ok`')
  }
})
const CustomType = new Type(CustomRule)
CustomType.test('ok') // true
```

The function which you passed into `new Rule()` should have a parameter.
If you want to make assert fail, you should must return an instance of _ERROR_.

Notice: CustomRule is just a instance of Rule, it is not a type, do not have `assert` `trace` and so on.

**Any**

There is a special rule called `Any`, it means your given value can be any type:

```js
import { Dict, Any } from 'hello-type'

const MyType = Dict({
  top: Any,
})
```

**Null**

Your given value should be `null`.

**Undefined**

Your given value should be `undefined`.

**IfExists()**

Only when the value exists will the rule works.
If there is no value, or the value is undefined, this rule can be ignored.

- @type function
- @param any rule
- @return instance of Type/Rule

```js
import { Dict, IfExists } from 'hello-type'

const PersonType = Dict({
  name: String,
  age: IfExists(Number),
})
PersonType.test({ name: 'tomy' }) // true
PersonType.test({ name: 'tomy', age: 10 }) // true
PersonType.test({ name: 'tomy', age: null }) // false
```

If there is `age` property, PersonType will check its value.
If `age` property does not exist, the checking will be ignored.

This rule will work in strict mode, too!

```js
PersonType.Strict.test({ name: 'tomy' }) // false
```

In strict mode, IfExists will be ignored, you must pass certain type of data to assert.

`IfExists` only works for Dict, List and Tuple.

```js
const PersonType = Dict({
  name: String,
  children: [IfExists(Object)], // => can be '[]' or '[{...}, ...]'
})
```

```js
const ParamsType = Tuple(String, IfExists(Number)) // => can be ('name') or ('name', 10)
```

In Tuple, only the rest items can be if_exists.

**IfNotMatch()**

If the target not match passed rule, you can set a default value to replace.
Only works for object.

```js
const SomeType = Dict({
  name: String,
  age: IfNotMatch(Number, () => 0),
})
const some = {
  name: 'tomy',
}

SomeType.assert(some) // without any error
// => some.age === 0
```

The second parameter should be a function to return the final value.

```js
function modify(value) {
  return value
}
```

Notice, this method will change your original data, so be careful when you use it.

**IfExistsNotMatch()**

If the property of object not exists, ignore this rule, if exists and not match, use default value to replace original object.

```js
const SomeType = Dict({
  name: String,
  age: IfExistsNotMatch(Number, () => 0),
})

SomeType.assert({ name: 'tomy' }) // whithout error, and no replacing

SomeType.assert({ name: 'tomey', age: null }) // whithout error and `age` was set to be 0
```

**InstanceOf()**

The value should be an instance of given class:

```js
class MyPattern {}
const MyType = Dict({
  someObj: InstanceOf(MyPattern),
  age: InstanceOf(Number),
})

let myins = new MyPattern()
let age = new Number(10)
MyType.test({ somObj: myins, age }) // true
```

**Equal()**

The value should equal to the given value, the given value can be anything.

```js
const MyType = Dict({
  type: Equal(Number)
})
MyType.assert({ type: Number })
```

**Lambda(InputRule, OutputRule)**

The value should be a function, and the parameters and return value should match passed rules.

_Notice: this rule can only used in array or object, and will modify the original function._

- @type function
- @param InputType: should best be Tuple if you have multiple arguments
- @param OutputType
- @return an instance of Rule

```js
const SomeType = Dict({
  fn: Lambda(Tuple(String, Number), Object),
})
const some = {
  fn: (str, num) => ({ str, num }),
}

SomeType.assert(some)
some.fn('tomy', null) // throw error because the second parameter is not Number
```

Notice: If the params not match the type, the function will not urn any more.
So don't use it if you do not know whether you should.

**Validate(rule, message)**

Sometimes, you want to use your own error message to be thrown out. `Validate` rule help you to reach this.

- @type function
- @param rule: a function which to return a boolean, true means pass/match, false means not, or any other rules
- @param message: the message to be thrown when not pass
- @return a instance of Rule

```js
let MyRule = Validate(value => typeof value === 'object', 'target should be an object.')
let MyType = new Type(MyRule)
MyType.assert('111') // throw _ERROR_ with 'Target should be an object.'
```

```js
let MyRule = Validate(String, 'target should be a string.')
```

```js
// pass a function as second parameter to receive the value which to be validated
let MyRule = Validate(Number, value => `${value} is not a number.`)
```

**Determine(factory)**

Sometimes, you want your rule depends on the prop's parent node, with different value, with different rule. `Determine` do not check the prop value type immediately, it use the return value of `factory` as a rule to check data type.

- @type function
- @param factory: a function which receive target object and should return a new rule
  - @param target: the parent object of current property
  - @return a instance of Rule
- @return a instance of Rule

```js
const SomeType = Dict({
  name: String,
  isMale: Boolean,
  // data type check based on person.isMale
  touch: Determine(function(person) {
    if (person.isMale) {
      return String
    }
    else {
      return Null
    }
  }),
})
```

## HelloType

The `HelloType` is a set of methods to use type assertions more unified.

```js
import { HelloType } from 'hello-type'
```

### expect.to.match

```js
HelloType.expect(some).to.match(SomeType) // it is almostly lik `SomeType.assert(someobject)`
```

SomeType can be original rule:

```js
HelloType.expect(10).to.match(Number)
```

**silent**

When you set `HelloType.silent` to be 'true', `HelloType.expect.to.match` will use `console.error` instead of `throw TypeError`, and will not break the program.

```js
HelloType.silent = true
HelloType.expect(some).to.match(SomeoType) // console.error(e)
```

Notice, `silent` only works for `HelloType.expect.to.match`, not for `Type.assert`.

### catch.by.with

```js
let error = HelloType.catch(some).by(SomeType)
let error = HelloType.catch(10).by(Number)
```

### is.typeof

```js
let bool = HelloType.is(SomeType).typeof(some)
let bool = HelloType.is(Number).typeof(10)
```

### is.of

```js
let bool = HelloType.is(some).of(SomeType)
let bool = HelloType.is(10).of(Number)
```

### trace.by.with

```js
HelloType.trace(some).by(SomeType).with(fn)
```

### track.by.with

```js
HelloType.track(some).by(SomeType).with(fn)
```

### bind/unbind

Bind some functions, so that when assert fail, the functions will run.

```js
HelloType.bind(fn)
HelloType.unbind(fn)
```

example:

```js
const showError = (err) => Toast.error(err.message)
window.addEventListener('error', (e) => {
  let { error } = e
  if (error.owner === 'hello-type') {
    e.preventDefault() // when throw _ERROR_, there will no error massage in console
  }
})

HelloType.bind(showError) // use your own action to notice users

// when the assert fail, it throw TypeError, however, `fn` will run before error thrown
HelloType.expect(some).to.match(SomeoType)

// HelloType will not break the process
HelloType.silent = true
// `fn` will run before console.error
HelloType.expect(some).to.match(SomeoType)
```

A callback function:

- @param error
- @param action: 'assert', 'test', 'trace', 'track', 'catch'

Notice, `bind` only works for `HelloType` , `Type` methods will not follow this rule.

```js
HelloType.bind(function(error, action) {
  if (action === 'trace') {
    bugReportJs.report(error)
  }
})
HelloType.trace(args).by(someType) // without `.with` on tail
```

### decorate

Use to decorate class and its members:

```js
@HelloType.decorate.with((...args) => SomeTupleType.assert(...args)) // decorate constructor
class SomeClass {
  @HelloType.decorate.with((value) => SomeType.assert(value)) // decorate a property member
  propertyName = null

  @HelloType.decorate.input.with((...args) => SomeTupleType.assert(...args)) // decorate the parameters of a property method
  @HelloType.decorate.output.with((value) => SomeType.assert(value)) // decorate the return value of a property method
  @HelloType.decorate.with((value) => SomeFunctionType.assert(value)) // decorate the property with a Function type
  methodName(...args) {}
}
```

### define.by

Convert an object to be a proxy object which will check its property's type:

```js
const SomeType = Dict({
  name: String,
  age: Number,
  child: {
    name: String,
    age: Number,
  },
  books: [Object],
})
const obj = HelloType.define({}).by(SomeType)
obj.child.age === undefined // true
obj.age = '10' // throw TypeError
obj.child.name = null // throw TypeError
```

It is only works for object/sub-objects, not for any array/sub-arrays:

```js
obj.books[0].name = null // without any effects
```

## _ERROR_

Advance TypeError which has `addtrace` method.

```js
import { _ERROR_ } from 'hello-type'
```

- @param key/message
- @param params

```js
let error = new _ERROR_('{arg} is not good.', { arg: 'tomy' })
error.addtrace({ arg: 'lily' })
console.log(error.message) // 'lily is not good.'
```

Use `messages` to replace the default message text. Look into [error.js](./src/error.js) to find out which to replace.

```js
_ERROR_.messages.enum = '{target}不符合枚举类型{type}({rules})，请从枚举列表中选择。'
```

When you create your own rule, you should return an instance of HellTypeError:

```js
const MyRule = new Rule(function(value) {
  if (value !== 'tomy') {
    return new _ERROR_('{target} is not "tomy"', { target: value })
  }
})
```

## Test

```
npm test
```

## MIT License

Copyright 2018 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
