const {ObjectId} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

var id = '5a69b0ff73c30bb2c2cbc200';

if(!ObjectId.isValid(id)){
  console.log('id is not valid');
}else{
  Todo.findById(id).then((todo) => {
    if(!todo){
      return console.log('id not found');
    }
    console.log(todo);
  });
}

User.findById('5a695dda173a37b00ed25899').then((user) => {
  if(!user){
    return console.log('Id not found');
  }
  console.log(JSON.stringify(user, undefined, 2));
}, (e) => {
  console.log(e);
});

