var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})

var app2 = new Vue({
  el: '#app-2',
  data: {
    message: 'You loaded this page on ' + new Date().toLocaleString()
  }
})

var app3 = new Vue({
  el: '#app-3',
  data: {
    seen: true
  }
})
// in console:
//  app3.seen = false

var app4 = new Vue({
  el: '#app-4',
  data: {
    todos: [
      { text: 'One' },
      { text: 'Two' },
      { text: 'Three' }
    ]
  }
})
//  app4.todos.push({ text: 'Four' })

var app5 = new Vue({
  el: '#app-5',
  data: {
    message: 'Hello, there!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }
})

var app6 = new Vue({
  el: '#app-6',
  data: {
    message: 'Howdy.'
  }
})

Vue.component('todo-item', {
  props: ['todo'],
  template: '<li>{{ todo.text }}</li>'
})

var app7 = new Vue({
  el: '#app-7',
  data: {
    groceryList: [
      { id: 0, text: 'Veggies' },
      { id: 1, text: 'Meats' },
      { id: 2, text: 'Snacks' },
    ]
  }
})

