const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

var UserShema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      massage: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true
    }
  }]
});

UserShema.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
}

UserShema.methods.generateAuthToken = function() {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, 'secret').toString();

  user.tokens.push({access, token});

  return user.save().then(() => {
    return token
  });
};

var User = mongoose.model('User', UserShema);

module.exports = {User};
