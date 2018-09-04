import { Dict, List } from 'hello-type'

const ProjectType = Dict({
  id: Number,
  name: String,
  creator: {
    uid: Number,
    username: String,
    policeis: Array,
  },
  create_time: Number,
})

const BooksType = List([{
  name: String,
  author: String,
  price: Number,
}])


function catchError(error) {
  if (error) {
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(Object.assign({}, error)),
    })
  }
}

class MyComponent {

  @HelloType.decorate.input.with(project => ProjectType.trace(project).with(catchError))
  @HelloType.decorate.output.with(books => BooksType.trace(books).with(catchError))
  renderWithProject(project) {
    // ...
    return books
  }

}

const SomeType = Dict({
  name: String,
  age: Number,
})
SomeType.Strict.assert({
  name: 'tomy',
  age: 10,
  height: 170,
})

