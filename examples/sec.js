import { Dict, List, Tuple, Enum, Type } from 'hello-type'

// A dict is a key-value structure, in which keys should not be changed
const BookType = Dict({
  name: String,
  author: String,
  price: Number,
})
function read(book) {
  BookType.assert(book)

  // { name: 'Hamlet', author: 'William Shakespeare', price: 123.4 } => true
  // { name: 'Hamlet' } => false
  // { name: 'Hamlet', author: 'William Shakespeare', price: 123.4, count: 23 } => false
}

// An enum type is a choice collection
const ColorType = Enum('white', 'red', 'yellow')
function pick(color) {
  ColorType.assert(color)
}

// A list is a serials of same type items, the items in list can be changed (add, remove, replace)
const BooksType = List(BookType)
function sell(books) {
  BooksType.assert(books)
}

// A tuple is a serials of any type items, the items in tuple can not be changed
const ParamsType = Tuple(BookType, ColorType)
function buy(book, color) {
  ParamsType.assert(book, color)
}


const NumberType = new Type(Number)

const NumList = (count) => new Type(...[].fill(0, --count).map(() => Number))
const RangeType = NumList(2) // [1, 5]

const CustomType = new Type({
  person: PersonType,
  books: BooksType,
  color: ColorType,
  sub: {
    title: String,
    children: List(Object)
  },
  queue: Array,
})

// difference between Object and Dict and Type:
// - Object: any structure
// - Dict: one level, keys can not be changed
// - Type: any structure with passed parameter

// difference between Array and List and Tuple:
// - Array: list item can be any type
// - List: list item should be same type
// - Tuple: certain count, typed at certain index place

// 1. assert
// throw error if not match
HelloType.expect(book).typeof(BookType)
BookType.assert(book)
// @HelloType.docorator.expect.typeof(BookType) // use as Decorator on class

// 2. judgement
// return true or false
HelloType.is(book).typeof(BookType)
BookType.meet(book)

// 3. track async
HelloType.trace(book).by(BookType).catch((reports) => {})
BookType.trace(book).catch((reports) => {})
// @HelloType.docorator.trace.by(BookType) // use as Decorator on class

const LambdaType = Dict({
  fn: Lambda(Tuple(String, Number, IfExists(Boolean)), Object)
})
