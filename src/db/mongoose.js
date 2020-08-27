const mongoose = require('mongoose');
const config = require('../config');


const connectionURL = config.database.url;

mongoose.connect(connectionURL, { useNewUrlParser: true, useCreateIndex: true });


// const me = new User({
//     name: 'Emre',
//     email: 'eykuzhan@gmail.com',
//     age: 23
// });

// me.save().then(res => {
//     console.log('RES', res)
// }).catch(err => console.log('ERR', err));