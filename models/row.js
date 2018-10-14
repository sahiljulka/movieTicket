var mongoose=require('mongoose');

var Schema=mongoose.Schema;
var RowSchema=new Schema({
    theatreName:{type:String},
    name:{type:String},
    noOfSeats:{type:Number},
    aisleSeats:[Number]
});

module.exports=mongoose.model('Row',RowSchema);