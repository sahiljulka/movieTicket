var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var TheatreSchema=new Schema({
    name:{
        type:String
    },
    filledSeats:{
        type:[String]
    }
});

module.exports=mongoose.model('Theatre',TheatreSchema);