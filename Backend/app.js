const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const usersRoutes = require ('./routes/user-routes');
const eventsRoutes = require ('./routes/event-routes');

const app = express();

app.use(bodyParser.json());

app.use('/api/users',usersRoutes);// => api/users/....
app.use('/api/events',eventsRoutes);// => api/events/....


mongoose.connect(process.env.MONGODB_URL)
.then(()=>{
    app.listen(3500);
    console.log('Server is running on port 3500');
}).catch(err=>{
    console.log(err);
});


