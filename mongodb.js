const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient

const connectionURL = 'mongodb://127.0.0.1:27017';
const databaseName = 'trialDB';

MongoClient.connect(connectionURL, {useNewUrlParser: true}, (error, client) => {
    if(error) {
        return console.log('ERROR', error)
    }

    console.log('CONNECTED');

    const db = client.db(databaseName);
    db.collection('users').insertOne({
        name: 'Emre',
        age: 23
    }, (error, response) => {
        if(error) {
            return console.log('Error while inserting to the db', error)
        }
        console.log(response.ops);
    });

})