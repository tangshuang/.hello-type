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

**test(...args)**

Assert whether the args match the type.
Return true if match, and return false if not match.

**catch(...args)**

Assert whether the args match the type.
Return null if match, and return error object if not match.

**trace(...args)**

Assert whether the args match the type.
It will run async, and return a promise.
If not match, it will rejected. You can do like:

```js
PersonType.trace(person).catch((error) => console.log(error))
```

**strict**

Whether use strict mode, default mode is false. If you use strict mode, object properties which not in type defined will be treated as not matching, array length should match.

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

```js
const MyType = new Type([Number, Number])
MyType.strict.assert([1]) // array length should be 2, but here just passed only one
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

Notice: CustomRule is just a instance of Rule, it is not a type, do not have `assert` `trace` and so on.

Rules priority:

- custom rule: notice here, custom rule comes firstly
- equal: 'a' === 'a'
- NaN
- Number
- Boolean
- String
- Array
- Object
- instanceof: [] instanceof Array
- instanceof (nested) Type: new Type(Dict(...), List(...))

**rule of 'object'**

HelloType will check the structure and property value type of object:

```js
const MyType = new Type({
  obj: {
    name: String,
    Sub: {
      title: String,
    },
  },
})
```

In this case, the pending verify object should have the same structure.

**rule of 'array'**

HelloType will check the array's each item's type with the given rule:

```js
const MyType = new Type({
  arr: [Number, String, Function, CustomType],
})
```

The pending verify array's items should be right data type as the given order. If the array length is longer than the rule's length, the overflow ones should be one of these rules. For example, the 5th item should be Enum(Number, String, Function, CustomType).

## HelloType

It is a set of APIs.

1. assert

```js
// BookType.assert(book)
HelloType.expect(BookType).to.be.typeof(book)
HelloType.expect(BookType).to.stritly.be.typeof(book)

HelloType.expect(book).to.match(BookType)
HelloType.expect(book).to.strictly.match(BookType)
```

2. test

```js
// BookType.test(book)
HelloType.expect(BookType).to.test(book)
HelloType.expect(BookType).to.strictly.test(book)
```

```js
if (HelloType.expect(BookType).to.test(book)) {
  //...
}
```

3. catch

```js
// BookType.catch(book)
HelloType.expect(BookType).to.catch(book)
HelloType.expect(BookType).to.strictly.catch(book)
```

```js
let error = HelloType.expect(BookType).to.catch(book)
```

4. track

```js
// BookType.trace(book).catch((error) => {})
HelloType.expect(BookType).to.trace(book).catch((error) => {})
HelloType.expect(BookType).to.strictly.trace(book).catch((error) => {})
```

5. decorator

```js
@HelloType.expect.to.be.strictly.matched.with(BookType)
@HelloType.expect.to.be.strictly.matched.with(BookType)

@HelloType.expect.to.be.strictly.traced.by(BookType)
@HelloType.expect.to.be.strictly.traced.by(BookType)
```


## MIT License

Copyright 2018 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.