const express = require('express');
require('./db/mongoose');
const User = require('./models/User');
const userRouter = require('./routers/user'); 
const config = require('./config')

//MUST
const app = express();
console.log('CONFIG', config.jwttoken.secret)

// app.use((req, res, next) => {
//     next();
// });
app.use(express.json());
app.use(userRouter);

const PORT = config.server.port || 3000;


app.listen(PORT, () => {
    console.log('SERVER IS LISTENING');
});