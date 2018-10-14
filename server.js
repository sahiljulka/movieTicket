var express=require('express');
var mongoose=require('mongoose');
const bodyParser = require('body-parser');

//To be used when deployed on heroku
const port=process.env.PORT || 9090;

var movieRoutes=require('./routes/movieRoutes');
var createTheatreRoute=require('./routes/createTheatreRoute');
var reserveTicketRoute=require('./routes/reserveTicketRoute');

//this creates the secret to link to database
//should be stored at environment variables when hosted
//only for temporary purposes
var secret=require('./config/secret');


//express framework to create server
var app=express();

//to parse the data passed in requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//it uses mongodb database by mlab
mongoose.connect(secret.database,(err)=>{
    err?console.log('unable to connect to Database'):console.log('connected to Database');
});

//modular approach to create routes
app.use(createTheatreRoute);
app.use(movieRoutes);
app.use(reserveTicketRoute);


app.listen(port,()=>{
    console.log(`Server listening on port ${port}`)
});