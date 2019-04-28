TypeSchema
==========

An ECMAScript data arrangement system.

【[中文文档](https://www.tangshuang.net/5625.html)】

TypeSchema is a js runtime data arrangement system, which contains 4 parts: Rule, Type, Schema and Model.
You can use TypeSchema to:

- delimit data with type
- validate data
- formulate data by type

TypeSchema is always used to check data type or sturcture when interact with backend api in frontend, however, you can use it anywhere even in nodejs.

## Install

```
npm i typeschema
```

## Usage

```js
import TypeSchema from 'typeschema'
```

or

```js
const { TypeSchema } = require('typeschema')
```

or

```html
<script src="/node_modules/typeschema/dist/index.js"></script>
<script>
const { TypeSchema } = window['typeschema']
</script>
```

## Rule

A `Rule` is a Behavior Definition of an automic data.
For example, `var a = 10` and we know `a` is a number.
But how do you know `a` is a number which will be stored/computed as number type by V8? And how do you know a variable is a what behavior definition?

We have native prototypes/definition:

- String
- Number: should be a finite number, not match `NaN` `"123"` and `Infinity`
- Boolean: should be one of `true` or `false`
- Object: should be a normal object like `{}`, not match instance of class, array and Object self
- Array: should be a normal array like `[]`, not match instance of class inherited from Array and Array self
- Function
- RegExp: should be a string match regexp
- Symbol: should be a symbol
- NaN
- Infinity
- Date
- Promise

But these do not contains all of what we want, we want more.
Now you can use Rule to define a behavior definition of a variable.

And we extended so that we now have:

- Int
- Float
- Numeric: number or number string
- Null
- Undefined
- Any

And to use `Rule` conveniently, we provide functions to generate rules:

- asynchronous(fn:type)
- validate(fn, msg)
- match(...types)
- ifexist(type)
- ifnotmatch(type, defaultValue)
- determine(fn:type)
- shouldexist(fn, type)
- shouldnotexist(fn)
- implement(Constructor)
- equal(value)
- lambda(inputType, outputType)

After you learn the usage of `Rule`, you can define your own rule to create new definition.

```js
// example
import { Rule } from 'typeschema'
export const NumberString = new Rule('NumberString', value => typeof value === 'string' && /^\-?[0-9]+(\.{0,1}[0-9]+){0,1}$/.test(value))
```

## Type

A `Type` is a data nature, quality or characteristic.
You call a data as some type data, it means you know what genera it belongs to. For example, you call a boy as a Person, because you know the boy has what a Person should contains: a head, two hands and may talk.
In summary, Type contains the data behavior definition, the data structure and the ability to maintain data change as defined.
So a Type has the ability to check and trace data's characteristic, and throw out warn to user if the data is not of current Type.

To create a type, you can use:

- new Type(pattern)

And we have define some data structure:

- new Dict({ ... })
- new List([ ... ])
- new Tuple([ ... ])
- new Enum([ ... ])

```
+-------------+----------+----------+--
| TypeSchema  |    JS    |  Python  |
+=============+==========+==========+==
|    Dict     |  Object  |   dict   |
+-------------+----------+----------+-------------------
|    List     |  Array   |   list   |  mutable array
+-------------+----------+----------+--------------------
|    Enum     |   Set    |   set    |
+-------------+----------+----------+-------------------
|    Tuple    |          |   tuple  |  immutable determined array
+-------------+----------+----------+------------------------------
```

The output of these constructors are all types which can be used in our system.
And these 4 types are extended from `Type`.
Later I will tell you how to create type by using these constructors.

And to use `Type` conveniently, we provide functions to generate types:

- type(pattern)
- dict({ ... })
- list([ ... ])
- tuple([ ... ])
- enumerate([ ... ])

**Pattern**

To define a type, you should provide data behavior definition and data structure, these make up a Pattern.
A Pattern is what passed into `Type` constructors.

```js
const SomePattern = {
  name: String,
  age: Number,
}
const SomeType = new Dict(SomePattern)
```

Pattern is the design of type to implement the type's ability.
You can use js native prototypes/class/value or Rule or Type in a Pattern.
And different type constructor need different pattern form.

## Schema

A Schema is to describe data structure logic.
In javascript, we use object to reflect data set which contains fields, so in TypeSchema you should use object to define Schema.

A schema do not care the real data, it create a abstract data structure to validate and formulate data.
By using formulated data, your business code will never have type or structure problem.

```
+-------------+        +------------+
|  api data   |   ->   |   schema   |   ->   non-problem data
+-------------+        +------------+
```

Here schema is like a constraint to prevent data error in business code.

## Model

A model is a data container which provide features about data operation.
We always use a model in our business code to use data. Js native data is very weak, we provide a model that you can watch data change and based on schema, so that you can make your business logic more clear.

- watch data change
- computed property
- validate
- extract formdata

## Type Instance

In TypeSchema, the basic class constructor is `Type`, which is extended to `Dict` `List` `Enum` and `Tuple`.
You can create an instance:

```js
import { Type } from 'typeschema'
const SomeType = new Type(String)
// so that you can use methods' feature with SomeType
```

A `Type` instance have members:

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

**track(...args).with(fn)**

Assert whether the args match the type.
If not match, `fn` will run. You can do like:

```js
const SomeType = dict({
  name: String,
  age: Number,
})
const some = {
  name: 'tomy',
  age: 10,
}

SomeType.track(some).with((error) => console.log(error))
```

It will return a resolved promise anyway.
`fn` has three parameters:

- error: the catched error, if pass, it will be undefined
- args: array, targets to match
- type: which type be used to match

**trace(...args).with(fn)**

Assert (asynchronously) whether the args match the type.
If not match, `fn` will run. It is the same usage with tack:

```js
SomeType.trace(some).with((error) => console.log(error))
```

*The difference between `track` and `trace` is trace will validate parameters asynchronously, so that if you change the data after trace, it may cause validate failure.*


**toBeStrict()/strict/Strict**

Whether use strict mode, default mode is false. If you use strict mode, object properties count should match, array length should match, even you use `ifexist`.

```js
const MyType = list([Number, Number])
MyType.Strict.assert([1]) // array length should be 2, but here just passed only one

const MyType = dict({
  name: String,
  age: Number,
})
MyType.Strict.assert({
  name: 'tomy',
  age: 10,
  height: 172, // this property is not defined in type, so assert will throw an error
})
```

However, `MyType.Strict` is different from `MyType.toBeStrict()`, `.toBeStrict()` is to covert current instance to be in strict mode, but `.Strict` or `.strict` will get a _new_ instance which is in strict mode. If you want to use a type container instance only one in strict mode, you can use `.toBeStrict()`, if you want to use multiple times, use `.Strict` instead.

```js
const MyType = dict({
  body: dict({
    head: Object,
  }).toBeStrict(), // here I will use Dict directly in strict mode
})
```

### Dict/List/Enum/Tuple

These 4 types of data structure is extended from `Type`. So they have the same methods with `Type`.

+-------------+----------+----------+--
| TypeSchema  |    JS    |  Python  |
+-------------+----------+----------+--
|    Dict     |  Object  |   dict   |
+-------------+----------+----------+-------------------
|    List     |  Array   |   list   |  mutable array
+-------------+----------+----------+--------------------
|    Enum     |   Set    |   set    |
+-------------+----------+----------+-------------------
|    Tuple    |          |   tuple  |  immutable array
+-------------+----------+----------+-------------------

**Dict**

A Dict is a type of object.

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

## List()

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

## Tuple()

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

## Enum()

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

## Range()

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
    return new Error(value + ' not equal `ok`')
  }
  else {
    return true
  }
})
const CustomType = new Type(CustomRule)
CustomType.test('ok') // true
```

The function which you passed into `new Rule()` should have a parameter.
If you want to make assert fail, you should must return: 1) an error, 2) true or false, 3) any even undefined.

Notice: CustomRule is just a instance of Rule, it is not a type, do not have `assert` `trace` and so on.

**Any**

There is a special rule called `Any`, it means your given value can be any type:

```js
import { Dict, Any } from 'typeschema'

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
import { Dict, IfExists } from 'typeschema'

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

**Lambda(InputType, OutputType)**

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
MyType.assert('111') // throw Error with 'Target should be an object.'
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

**Async**

Make a rule which not build the rule immediately.

- @param function fn a function which should return a rule
- @return Rule

```js
const AsyncRule = Async(async () => {
  const data = await fetch(url)
  if (data.type === 'list') {
    return Array
  }
  else {
    return Any
  }
})
```

## Ts

The `Ts` is a set of methods to use type assertions more unified.

```js
import { Ts } from 'typeschema'
```

### expect.to.match

```js
Ts.expect(some).to.match(SomeType) // it is almostly lik `SomeType.assert(someobject)`
```

SomeType can be original rule:

```js
Ts.expect(10).to.match(Number)
```

**silent**

When you set `Ts.silent` to be 'true', `Ts.expect.to.match` will use `console.error` instead of `throw TypeError`, and will not break the program.

```js
Ts.silent = true
Ts.expect(some).to.match(SomeoType) // console.error(e)
```

Notice, `silent` only works for `Ts.expect.to.match`, not for `Type.assert`.

### catch.by.with

```js
let error = Ts.catch(some).by(SomeType)
let error = Ts.catch(10).by(Number)
```

### is.typeof

```js
let bool = Ts.is(SomeType).typeof(some)
let bool = Ts.is(Number).typeof(10)
```

### is.of

```js
let bool = Ts.is(some).of(SomeType)
let bool = Ts.is(10).of(Number)
```

### trace.by.with

```js
Ts.trace(some).by(SomeType).with(fn)
```

### track.by.with

```js
Ts.track(some).by(SomeType).with(fn)
```

### bind/unbind

Bind some functions, so that when assert fail, the functions will run.

```js
Ts.bind(fn)
Ts.unbind(fn)
```

example:

```js
const showError = (err) => Toast.error(err.message)
window.addEventListener('error', (e) => {
  let { error } = e
  if (error.owner === 'typeschema') {
    e.preventDefault() // when throw Error, there will no error massage in console
  }
})

Ts.bind(showError) // use your own action to notice users

// when the assert fail, it throw TypeError, however, `fn` will run before error thrown
Ts.expect(some).to.match(SomeoType)

// Ts will not break the process
Ts.silent = true
// `fn` will run before console.error
Ts.expect(some).to.match(SomeoType)
```

A callback function:

- @param error
- @param action: 'assert', 'test', 'trace', 'track', 'catch'

Notice, `bind` only works for `Ts` , `Type` methods will not follow this rule.

```js
Ts.bind(function(error, action) {
  if (action === 'trace') {
    bugReportJs.report(error)
  }
})
Ts.trace(args).by(someType) // without `.with` on tail
```

### decorate

Use to decorate class and its members:

```js
@Ts.decorate.with((...args) => SomeTupleType.assert(...args)) // decorate constructor
class SomeClass {
  @Ts.decorate.with((value) => SomeType.assert(value)) // decorate a property member
  propertyName = null

  @Ts.decorate.input.with((...args) => SomeTupleType.assert(...args)) // decorate the parameters of a property method
  @Ts.decorate.output.with((value) => SomeType.assert(value)) // decorate the return value of a property method
  @Ts.decorate.with((value) => SomeFunctionType.assert(value)) // decorate the property with a Function type
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
const obj = Ts.define({}).by(SomeType)
obj.child.age === undefined // true
obj.age = '10' // throw TypeError
obj.child.name = null // throw TypeError
```

It is only works for object/sub-objects, not for any array/sub-arrays:

```js
obj.books[0].name = null // without any effects
```

## Error

Advance TypeError which has `addtrace` method.

```js
import Ts from 'typeschema'
const { Error } = Ts
```

- @param key/message
- @param params

```js
let error = new Error('{arg} is not good.', { arg: 'tomy' })
error.addtrace({ arg: 'lily' })
console.log(error.message) // 'lily is not good.'
```

Use `translate` to change message dymaticly:

```js
let message = error.translate('{arg}有问题，请检查。')
```

Or you can change the error message by set the second parameter to be `true`:

```js
error.translate('{arg}有问题，请检查。', true)
let message = error.message
```

## MIT License

Copyright 2018 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
