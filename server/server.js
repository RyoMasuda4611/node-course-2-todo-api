require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcryptjs'); 

var {mongoose} = require('./db/mongoose.js');
var {Todo} = require('./models/todo.js');
var {User} = require('./models/user.js');
var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  } else {
    Todo.findOne({
      _id: id,
      _creator: req.user._id
    }).then((todo) => {
      if(todo){
        return res.send({todo});
      }
      res.status(404).send();
    }).catch((e) => {
      res.status(400).send();
    });
  }
});

app.delete('/todos/:id', authenticate, async (req, res) => {
  var id = req.params.id;
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  } else {
    try {
      const todo = await Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
      });
      if(!todo){
        return res.status(404).send();
      }
      res.send({todo});
    } catch(e) {
      res.status(400).send();
    }
  }
});

app.patch('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'completed']);

  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  }
  if(_.isBoolean(body.completed) && body.completed){
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({
    _id: id,
    _creator: req.user._id
  }, { $set: body }, { new: true }).then((todo) => {
    if(!todo){
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => res.status(400).send());
});

app.post('/users', async (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);
  try{
    await user.save();
    const token = user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch(e) {
    res.status(400).send(e);
  };
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', async (req, res) => {
  try {
    var body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch(e) {
    res.status(400).send();
  };
});

app.delete('/users/me/token', authenticate, async (req, res) => {
  try {
    await req.user.removeByToken(req.token);
    res.status(200).send();
  } catch(e) {
    res.status(400).send();
  }
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {app};
