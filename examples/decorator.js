import HelloType, { Dict, Type } from '../src/hello-type'

const BookType = Dict({
  name: String,
  price: Number,
})
const NumberType = new Type(Number)

// throw Error if not pass right type
@HelloType.decorator.expect.typeof(BookType)
class Book {
  constructor(book) {
    this.book = book
  }

  // do not throw error, track error
  @HelloType.decorator.trace.by(NumberType)
  open(page) {
    console.log(page)
  }
}

function report() {
  // get error trace
  let logs = HelloType.decorator.trace.report()
  console.log(logs)
}

// bind error event callback
HelloType.decorator.trace.onerror = function(errObj) {
  fetch('mylogserver', {
    method: 'post',
    body: JSON.stringify(errObj),
  })
}