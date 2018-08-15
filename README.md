HelloType
=========

An ECMAScript data type check library.

## Install

```
npm i -S hello-type
```

## Usage

```js
import HelloType, { Dict, Enum, Tuple, List, Type, Rule, Self } from 'hello-type'
```

or

```js
const { Dict, Enum, Tuple, List, Type, Rule, Self, HelloType } = require('hello-type')
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

- String: should be a string
- Number: should be a finite number, `NaN` `"123"` and `Finite` will not match
- Boolean: should be one of `true` or `false`
- Object: should be a normal object like `{}`, instance of class, array and Object self will not match
- Array: should be an array
- Function: should be a function
- RegExp: should be a regexp
- ... any other js data prototype
- Dict(?): should be structed with passed value
- List(?, ?, ?): should be an array which has certain sturcted item
- Enum(?, ?, ?): should be one of these values
- Tuple(?, ?, ?): should be same number and structure with each value, always used for function parameters
- ?: any value to equal, i.e. new Type({ name: 'tomy' }), name should must be 'tomy'
- ?: an instance of `Type`, will flow the rules of it
- new Rule(factory): a custom rule
- Any, Self

A type instance have members:

**assert(...args)**

Assert whether the args match the type.
If not match, it will use `throw` to break the program.

**test(...args)**

Assert whether the args match the type.
Return true if match, and return false if not match.

**catch(...args)**

Assert whether the args match the type.
Return null if match, and return error object if not match.

```js
let error = PersonType.catch(person)
```

If there is no error, `null` will be returned.
Error structure:

```js
{
  targets, // an array, i.e. [person]
  type, // PersonType
  error, // Error instance
}
```

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

Do not pass nested object, use another Dict instead:

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

They are absolutely the same.

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
  return value === 'ok'
})
const CustomType = new Type(CustomRule)
CustomType.assert('ok')
```

The function which you passed into `new Rule()` should have a parameter and return true or false.
`true` means match, `false` means not match.

Notice: CustomRule is just a instance of Rule, it is not a type, do not have `assert` `trace` and so on.

**Any**

There is a special rule called `Any`, it means your given value can be any type:

```js
import { Dict, Any } from 'hello-type'

const MyType = Dict({
  top: Any,
})
```

**Self**

A referer to type self:

```js
import { Dict, Self } from 'hello-type'

const PersonType = Dict({
  son: Self, // person.son should match to PersonType too
})
```

Notice, `Self` should not be used in nested Dict, because  `Self` is referered to its scope, not to the root type scope.

**IfExists**

Only the value exists will the rule works.
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
```

If there is `age` property, PersonType will use PersonType self to check its value.
If `age` property does not exist, the checking will be ignored.

```js
PersonType.test({
  name: 'tomy',
}) // true
```

However, this rule will not work in strict mode!

```js
PersonType.strict.test({
  name: 'tomy',
}) // false
```

This will return false, because there is no `age` property.
And in fact, it only works for object rules, don't use IfExists in any other rules/types.

## HelloType

The `HelloType` is a set of methods to use type assertions more unified.

**expect**

```js
HelloType.expect(SomeType).toBe.typeof(someobject) // it is the same as `SomeType.assert(someobject)`
```

**is**

```js
if (HelloType.is(SomeType).typeof(someobject)) { // it is the same as `SomeType.test(someobject)`
  // ...
}
```

**catch.by**

```js
let error = HelloType.catch(someobject).by(SomeType) // it is the same as `SomeType.catch(someobject)`
```

**trace.by**

```js
HelloType.trace(someobject).by(SomeType).catch((error) => { // it is the same as `SomeType.trace(someobject)`
  // ...
}) 
```

**decorator**

Use to decorate class and its members:

```js
@HelloType.decorator.expect(SomeType)
class SomeClass {}
```

```js
@HelloType.decorator.trace.by(SomeType).catch(fn)
class SomeClass {}
```

**HelloType.strict**

```js
HelloType.strict.expect(SomeType).toBe.typeof(someobject) // it is the same as `SomeType.strict.assert(someobject)`
```

```js
@HelloType.strict.decorator.expect(SomeType)
class SomeClass {}
```

## MIT License

Copyright 2018 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.