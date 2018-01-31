const expect = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

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
      .end((err) => {
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

describe('GET /user/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')  
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create user', (done) => {
    var email = "natsume@gmail.com";
    var password = "walking";
    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toExist();
        expect(res.headers['x-auth']).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if(err){
          return done(err);
        }
        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        });
      });
  });

  it('should return validation error if request invalid', (done) => {
    request(app)
      .post('/users')
      .send({
        email: '123',
        password: 'abc'
      })
      .expect(400)
      .end(done);
  });

  it('should not create a user if the email in use', (done) => {
    request(app)
      .post('/users')
      .send({
        email: users[0].email,
        password: 'testtest'
      })
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[0]).toInclude({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        }).catch((e) => done(e));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.findById(users[1]).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done());
      });
  });
});
