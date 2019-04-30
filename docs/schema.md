### Schema Instance

You should pass the definition into schema:

```js
import { Schema } from 'typeschema'
const SomeSchema = new Schema({
  prop1: {
    type: String,
    default: '',
  },
  prop2: {
    type: Number,
    default: 0,
  },
})
```

**validate**
