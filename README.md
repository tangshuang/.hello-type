HelloType
=========

An ECMAScript data type check library.

## Install

```
npm i -S hello-type
```

## Usage

```js
import HelloType, { Dict, Enum, Tuple, List, Type, Rule } from 'hello-type'
```

or

```js
const { Dict, Enum, Tuple, List, Type, Rule, HelloType } = require('hello-type')
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
  family: Enum(3, 4, 5), // use `Enum()` to make a type
  classmetas: List(Object),
})
```

Then use this data type to check a data:

```js
function welcome(person) {
  PersonType.assert(person) // If the param `person` not match PersonType, an error will be thrown out
}
```

Check rules:

- String: should be string
- Number: should be finite number, `NaN` `"123"` and `Finite` will not match
- Boolean: should be `true` or `false`
- Object: should be normal object like `{}`, instance of class, array and Object self will not match
- Array: should be an array
- Function: should be a function
- RegExp: should be a regexp
- List(?): should be an array which has same sturcted item
- Enum(?, ?, ?): should be one of these values
- Dict(?): should be structed with passed value
- Tuple(?, ?, ?): should be same number and structure with each value, always used for function parameters
- ?: any class constructor which a data can be an instance of
- ?: any value to be equaled
- ?: an instance of `Type`, will flow the rules of it
- Rule(?): a custom rule

A type instance have methods:

**assert(...args)**

Assert whether the args match the type.
If not match, it will use `throw` to break the assert.

**trace(...args)**

Assert whether the args match the type.
It will run async, and return a promise.
If not match, it will rejected. You can do like:

```js
PersonType.trace(person).catch((error) => console.log(error))
```

**meet(...args)**

Assert whether the args match the type.
Return true if match, and return false if not match.

**catch(...args)**

Assert whether the args match the type.
Return null if match, and return error object if not match.

**strict**

Whether use strict mode, default mode is false. If you use strict mode, object properties which not in type defined will be treated as not matching.

```js
const MyType = new Type({
  name: String,
  age: Number,
})
MyType.strict.assert({
  name: 'tomy',
  age: 10,
  height: 172, // this property is not defined in type, so assert will throw an error
})
```

## Dict

A dict is a type of object. `Dict` is a function which return an instance of `Type`:

```js
const DictType = Dict({
  name: String,
  age: Number,
})
```

It is an easy/quick way to create an object type.

_What's the difference between Dict and Object?_

An Object match any structure of object. However, a Dict match certain structure of object.
For example, `new Type(Object)` and `new Type(Dict({ name: String }))` is different.

_What's the difference between Dict and new Type?_

Dict receive only one parameter.
If you pass only one parameter into `new Type`, they are the same.
For example, `Dict({ name: String })` is the same with `new Type({ name: String })`.
However, `new Type` can receive several parameters, it is the same as `Tuple`.

## Tuple

A tuple is a list of certain order items, the length of the list can not be changed, each item can have different structure.

Notice, only Tuple can receive multiple parameters.

```js
const ParamsType = Tuple(Object, Number, String)
ParamsType.assert({}, 1, 'ok')
```

_What's the difference between Tuple and new Type?_

They are absolutely the same.

## List

A list is an array in which every item has same structure. So it receive only one parameter:

```js
const ListType = List(Object)
```

_What's the difference between List and Array?_

In a list, every item has same structure, in an array, each item can have different structure.

_What's the difference between List and Tuple?_

A tuple does not typeof array, it is a group of scattered items with certain order.

## Enum

A enum is a set of values from which the assert value should pick.

```js
const ColorType = Enum('red', 'white', 'green')
ColorType.assert('black')
```

## Rule

Create a custom rule:

```js
const CustomRule = new Rule(function(value) {
  return value === 'ok'
})
const CustomType = new Type(CustomRule)
CustomType.assert('ok')
```

The function which you passed inot `new Rule()` should have a parameter and return true or false.
`true` means match, `false` means not match.

Rules priority:

- custom rule: notice here, custom rule comes firstly
- equal: 'a' === 'a'
- NaN
- Number
- Boolean
- Object
- instanceof: [] instanceof Array
- Type
- nested Type: new Type(Dict(...), List(...))

## HelloType

It is a set of APIs.

1. assert

```js
HelloType.expect(book).typeof(BookType) // BookType.assert(book)
@HelloType.decorator.expect.typeof(BookType) // use as Decorator on class or its member

HelloType.strict.expect(book).typeof(BookType) // strict mode
@HelloType.strict.decorator.expect.typeof(BookType)
```

2. judgement

```js
HelloType.is(book).typeof(BookType) // BookType.meet(book)
HelloType.strict.is(book).typeof(BookType) // strict mode

HelloType.catch(book).by(BookType) // BookType.catch(book)
HelloType.strict.catch(book).by(BookType) // strict mode
```

3. track

```js
HelloType.trace(book).by(BookType).catch((reports) => {}) // BookType.trace(book).catch((reports) => {})
@HelloType.decorator.trace.by(BookType) // use as Decorator on class or its member

HelloType.strict.trace(book).by(BookType).catch((reports) => {}) // strict mode
@HelloType.strict.decorator.trace.by(BookType)
```

```js
HelloType.decorator.trace.onerror = function(error) {
  // when trace catch error
}
```

```js
let logs = HelloType.decorator.trace.report()
```

## MIT License

Copyright 2018 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.