/*********************************************************************************/
//This route handles two functions i.e to get optimum seats or get unreserved seats
//depending upon the query paramtere passed
//We use two  collections here i.e. theatres and rows and get data from them
/*********************************************************************************/


var router=require('express').Router();
var Theatre=require('../models/theatre');
var Row=require('../models/row');

//this route calls a function depending upon the query parameter passed
router.get('/screens/:screenName/seats',(req,res)=>{
    let status=req.query.status;//console.log(status);
    if(status=='unreserved'){
        unreserved(req,res);
    }
    else{
        intuitiveUser(req,res);
    }
});

//To get all unreserved seats for 
//a particular theatre entered by user
function unreserved(req,res){
    let screenName=req.params.screenName;
    Theatre.aggregate([
        {$match:{"name":screenName}},
        {$lookup:{
            from:"rows",
            localField:"name",
            foreignField:"theatreName",
            as:"rows"
        }}
    ])
    .then((data)=>{
        let returnData=prepareAvailableSeats(data[0]);
        let dat={};
        dat["seats"]=returnData;
        res.send(dat);
    })
    .catch((err)=>{
        res.send(err);
    });
}

//To get the optimum seats for a seatNo,Row
//and totalSeats entered by user
function intuitiveUser(req,res){

    let screenName=req.params.screenName;
    //numSeats=no of seats entered by user
    let numSeats=req.query.numSeats;
    let seat=req.query.choice;
    //row contains the rowname entered by user i.e. 'A' in 'A12'
    let row=seat[0];
    //seatNo contains the seatNo entered by user i.e. '12' in 'A12'
    let seatNo=Number(seat.substring(1,seat.length));
    
    Theatre.find(
        {"name":screenName}
    )
    .then((docs)=>{
        var filledSeats=docs[0].filledSeats;
        //seats contain the seatNo that are already filled in
        //the row specified by use
        let seats=filledSeats.filter((d)=> d[0]==row)
        .map((d)=>{
            return Number(d.substring(1,d.length))
        });
        //this call to database fetches the data
        //for a specified rowName to get the totalSeats and aisleSeats
        Row.find({"name":row,"theatreName":screenName})
        .then((doc)=>{
            let total=doc[0].noOfSeats;
            let aisleSeats=doc[0].aisleSeats;
            let start=0,end=0;
            //start and end contain the index of aisle boundaries
            aisleSeats.every((value,i)=>{
                if(seatNo<(value)){
                    start=i-1;
                    end=i;
                    return false;
                }
                else if(seatNo==(value)){
                    i%2==0?(start=i,end=i+1):(start=i-1,end=i);
                    return false;
                }
                return true;
            });
            
            //s and e specify the value of aisle seats boundaries
            //in which the seatno specified by user lies
            let s,e;

            //this condition is used in the case when the seat lies in last 
            //boundary i.e consider seatNo 12 in aisleSeats[0,5,6,9]
            //in this case the seatNo will be in boundary 10 to 19 in case totalSeats are 20
            if(seatNo>=aisleSeats[aisleSeats.length-1] && seatNo<=total-1){
                if((aisleSeats.length-1)%2==0){
                    s=aisleSeats[aisleSeats.length-1];
                }
                else{
                    s=aisleSeats[aisleSeats.length-1]+1;
                }
                e=total-1;
            }
            else{
                s=aisleSeats[start];
                e=aisleSeats[end];
            }

            //windowStart and windowEnd are pointers that specify the range
            //in which seats can be booked
            let windowStart,windowEnd;

            //diff is used to check if there are seats possible 
            let diff=seatNo-numSeats+1;

            //the below conditions handle the different cases of optimum choices
            //of seats to be returned to user
            //considering the aisle seats in each row
            
            //Consider case noosseats=3 , choice= A1 , aisleSeats=[0,4,5,9]
            if(diff<s){
                let d1=s-diff;
                windowStart=s;
                windowEnd=seatNo+d1;
                //while loop in this case iterates over each possible range
                //and breaks when the correct range is found
                while(windowStart<=seatNo && windowEnd<=e){
                    if(isValidRange(seats,windowStart,windowEnd)){
                        res.send(prepareObject(windowStart,windowEnd,row));
                    }
                    windowStart+=1;
                    windowEnd+=1;
                }
            }
            //Consider case noosseats=3 , choice= A2 , aisleSeats=[0,4,5,9]
            else if(diff==s){
                windowStart=s;
                windowEnd=seatNo;
                //while loop in this case iterates over each possible range
                //and breaks when the correct range is found
                while(windowStart<=seatNo && windowEnd<=e){
                    if(isValidRange(seats,windowStart,windowEnd)){
                        res.send(prepareObject(windowStart,windowEnd,row));
                    }
                    windowStart+=1;
                    windowEnd+=1;
                }
            }
            else {
                windowStart=diff;
                windowEnd=seatNo;
                //while loop in this case iterates over each possible range
                //and breaks when the correct range is found
                while(windowStart<=seatNo && windowEnd<=e){
                    if(isValidRange(seats,windowStart,windowEnd)){
                        res.send(prepareObject(windowStart,windowEnd,row));
                    }
                    windowStart+=1;
                    windowEnd+=1;
                }
            }
            res.status(400);
            res.send(`${numSeats} contigous seats are not available`);
        })
    })
    .catch((err)=>{
        res.send(err);
    });
};

//this prepares data to be returned
//in a specified format by api returning unreserved seats
function prepareAvailableSeats(data){
    var returnData={};
    data.rows.map((c)=>{
        let dat=[];
        let m=data.filledSeats.filter((d)=> d[0]==c.name)
        .map((d)=>{
                        return d.substring(1,d.length)
                  });
        for(let i=0;i<c.noOfSeats;i++){
            if(!m.includes(i+"")){
                dat.push(i);
            }
        }
        returnData[c.name]=dat;
    });
    return returnData;
}

//To check if any seat in a given range is already booked
//used in intuitiveUser route
function isValidRange(data,windowStart,windowEnd){
    console.log("reserved "+data);
    console.log(windowStart+" "+windowEnd);
    for(let i=0;i<data.length;i++){
        if(data[i]>=windowStart && data[i]<=windowEnd)
            return false;
    }
    return true;
}

//this prepares data to be returned
//in a specified format by intuitiveUser route
function prepareObject(windowStart,windowEnd,rowName){
    let obj={};
    let arr=[];
    for(let i=windowStart;i<=windowEnd;i++){
        arr.push(i);
    }
    obj[rowName]=arr;
    let retObj={};
    retObj["availableSeats"]=obj;
    return retObj;
}

module.exports=router;