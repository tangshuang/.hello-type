# Rule

To create a rule, you should use `Rule`.

```js
import { Rule } from 'typeschema'

const SomeRule = new Rule({
  name: 'SomeRule',
  validate: function(value) {
    return typeof value === 'string'
  },
  override: function(value, key, target) {
    target[key] = value + '' // make it a string
  },
})

const NoNameRule = new Rule(function(value) {
  return typeof value === 'string'
})
```

Use a rule as a pattern:

```js
const SomeType = new Type(SomeRule)
```

**validate**

To check a variable with rule:

```js
let error1 = SomeRule.validate('12') // null or undefined
let error2 = SomeRule.validate(12) // error
```

**validate2**

Run validate second time after getting an error from the first validation and overriding.

```js
const obj = {
  name: 'tomy',
  age: 10,
}

let error1 = SomeRule.validate2(obj.name, 'name', obj) // null or undefined
let error2 = SomeRule.validate2(obj.age, 'age', obj) // null or undefined, obj.age will be overrided to be '10'
```
