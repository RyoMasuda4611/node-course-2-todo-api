const {MongoClient, ObjectId} = require('mongodb');

MongoClient.connect('mongodb://localhost:27018/TodoApp', (err, client) => {
  if(err){
    return console.log('Unable to connect to MongoDB server');
  }
  console.log('Connected to MongoDB server');
  const db = client.db('TodoApp');

  db.collection('Users').findOneAndUpdate({
    _id: new ObjectId('5a67f0bd4178d7aab119e5b8')
  }, {
    $set: {name: 'Ryo Masuda' }, $inc: {age: 1}
  }, {
    returnOriginal: false
  }).then((result) => {
    console.log(result);
  });
    client.close();
});
