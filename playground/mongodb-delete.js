const {MongoClient, ObjectId} = require('mongodb');

MongoClient.connect('mongodb://localhost:27018/TodoApp', (err, client) => {
  if(err){
    return console.log('Unable to connect to MongoDB server');
  }
  console.log('Connected to MongoDB server');
  const db = client.db('TodoApp');

  db.collection('Users').deleteMany({name: 'Ryo Masuda'}).then((result) =>{
    console.log(result);
  });

  db.collection('Users').findOneAndDelete({_id: new ObjectId('5a675dd65f8099a9be45f865')}).then((result)=> {
    console.log(result);
  });

  client.close();
});
