/************************************************************/
//This route handles the storing of a new theatre in database.
//We use two collections theatres,rows and store data in them
/************************************************************/

var router=require('express').Router();
var Theatre=require('../models/theatre');
var Row=require('../models/row');

//helper function to prepare data  to store in
//rows collection while creating a new theatre
function prepareData(data){
    var returnData=[];
    returnData.name=data.name;
    returnData.seatInfo=[];
    var row={};
    let rowData;
    for(let d in data.seatInfo)
	{
        row.theatreName=data.name;
        row.name=d;
        row.noOfSeats=data.seatInfo[d].numberOfSeats;
        row.aisleSeats=data.seatInfo[d].aisleSeats;
        rowData=new Row(row);
        returnData.push(rowData);
        row={};
    }
    return returnData;
}

router.post('/screens',(req,res)=>{
    var theatre={name:req.body.name,filledSeats:[]};

    //creating schema out of theatre data to send to theatre collection
    theatre=new Theatre(theatre);

    //rows to store information about each row in rows collection
    var rows=prepareData(req.body);

    //to save the newly created theatre document in database
    theatre.save().then((theatre)=>{
        //to save rows in rows in collection in database
        Row.collection.insert(rows)
        .then((data)=>{
            res.send(data);
        })
        .catch((err)=>{
            res.send(err);
        });
    })
    .catch((err)=>{
        res.send(err);
    });
});

module.exports=router;