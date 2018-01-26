const expect = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [{
    _id: new ObjectId(),
    text: 'First test todo'
  },{
    _id: new ObjectId(),
    text: 'Secound test todo',
    completed: true,
    completedAt: 123
  }
]

beforeEach((done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('POST /todos', () => {
  it('should create new todo', (done) => {
    var text = 'I wana do a something big';
    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if(err){ return done(err); }
        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e)=>{ done(e); });
      });
  });
  it('should not create new to do with invalid property', (done) => {
    var text = '';
    request(app)
      .post('/todos')
      .send({text})
      .expect(400)
      .end((err, res) => {
        if (err) { done(err); }
        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => {done(e);})
      })
  });
});

describe('Get /todos', () => {
  it('should get all todos', (done) => {
    request(app)
    .get('/todos')
      .expect(200)
      .expect( (res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('Get /todos/:id', () => {
  it('should return todo docs', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return 404 if no todo', (done) => {
    var id = new ObjectId();
    request(app)
      .get(`/todos/${id.toHexString()}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is invalid', (done) => {
    request(app)
      .get('/todos/123')
      .expect(404)
      .end(done);
  });
});

describe('Delete /todos/:id', () => {
  it('should remove a todo', (done) => {
  var hexId = todos[1]._id.toHexString();
  request(app)
    .delete(`/todos/${hexId}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(hexId);
    })
    .end((err, res) => {
      if(err){
        return done(err);
      }
      Todo.findById(hexId).then((todo) => {
        expect(todo).toBeFalsy();
        done();
      }).catch((e) => done(e));
    });
  });

  it('should return 404 if todo is not found', (done) => {
    var hexId = new ObjectId().toHexString();
    request(app)
      .delete(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is invalid', (done) => {
    var invalidId = 123;
    request(app)
      .delete(`/todos/${invalidId}`)
      .expect(404)
      .end(done);
  });
});

describe('Patch /todos/:id', () => {
  it('should update the todo', (done) => {
    var HexId = todos[0]._id.toHexString();
    var text = 'Test updated??';

    request(app)
      .patch(`/todos/${HexId}`)
      .send({
        text: text,
        completed: true
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(typeof res.body.todo.completedAt).toBe('number');
      })
      .end(done);
  });

  it('should clear completedAt when the todo is not completed', (done) => {
    var HexId = todos[1]._id.toHexString();

    request(app)
      .patch(`/todos/${HexId}`)
      .send({
        completed: false
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });
});


