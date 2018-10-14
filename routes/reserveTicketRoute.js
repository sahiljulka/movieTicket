/**************************************************************/
//This route handles the booking of a new ticket.
//We use one collection here i.e. theatres  and store data in it
/**************************************************************/

var router=require('express').Router();
var Theatre=require('../models/theatre');
var Row=require('../models/row');

//helper function to prepare data to be entered
//in filledSeats field in theatre collection
function prepareDataForReserve(data){
    var arr=[];
    for(let o in data["seats"])
    {
        let c=(data["seats"][o]);
        c.map(d1=>{
                    let ret=o+"";
                    ret+=d1;
                    arr.push(ret);
                  });
	
    }
    return arr;
}

router.post('/screens/:screenName/reserve',(req,res)=>{
    //gets the name entered by user
    let screenName=req.params.screenName;

    //data to store in filledSeats field in theatre collection
    let bookingInfo=prepareDataForReserve(req.body);

    Theatre.aggregate(
        [
            {$match: {"name":screenName}},
            {$project:{common:{$setIntersection:["$filledSeats",bookingInfo]}}}
        ]
    )
    .then((docs)=>{
        //condition checks if theatre with provided name exists or not
        if(docs.length==0){
            res.send(`No theatre with name ${screenName} found`);
        }
        //condition checks if already the seats are booked in past
        else if(docs[0].common.length!=0){
            res.status(400);
            res.send(`${docs[0].common} already booked`);
        }
        //it updates the filledSeats field in theatres collection
        //i.e enter new seats booked by user into filledSeats array in database
        else{
            Theatre.update(
                {"name":screenName},
                {$push:{filledSeats:bookingInfo}}
            )
            .then((docs)=>{
                res.send("Seats have been Reserved");
            })
            .catch((err)=>{
                res.send(err);
            });
        }
    })
    .catch((err)=>{
        res.send(err);
    });
});


module.exports=router;