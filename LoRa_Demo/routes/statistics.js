var express = require('express');
var router = express.Router();
var DeviceLog = require('../app/models/deviceLog');
var fs = require('fs');

//read place.json to get info
var places = {};
readJSONFile(__dirname + '/../public/place.json', function(err, json) {
    if(err) console.log(err)
    else{
        places = json.result;
        //console.log(places);
    }
});

router.get('/:deviceId', function (req, res) {
  var deviceId = req.params.deviceId;
  var name =(places.filter(function(item){
      return item.id == deviceId;
  }))[0].name
  
  //
  DeviceLog.find({EUI:deviceId, fcnt:0},{__v:0,_id:0,port:0,ack:0,cmd:0}).sort({ts:-1}).exec(function(err, doc1){
      if(err) console.log(err)
      else{
        console.log(doc1);
        Promise.all([
            new Promise(function(resolve, reject){
                if(doc1.length > 0){
                    console.log(doc1[0].ts);
                    resolve(doc1[0].ts);
                }else{
                    DeviceLog.find({EUI:deviceId},{__v:0,_id:0,port:0,ack:0,cmd:0}).sort({fcnt:1, ts:1}).limit(1).exec(function(err, doc2){
                        if(err) console.log(err);
                        else{
                            resolve(doc2[0].ts);
                        }
                    })
                }
            })
        ]).then(function(result){
            console.log(result[0]);
            DeviceLog.find({EUI:deviceId, ts:{$gte:result[0]}},{__v:0,_id:0,port:0,ack:0,cmd:0}).sort({'ts':1}).exec(function(err, doc3){
                if(err) console.log(err)
                else{
                    res.render('device', { title: name,info:JSON.stringify(doc3)});
                }
            });
        })
      }
  })
  
})
/* GET users listing. */
router.get('/', function(req, res, next) {
    
    var query = {};
    
            /*var array = [];
            var idx = 0;
            if(json.result){
                
                //do all the logic here
                json.result.forEach(function(device){
                    //get each device id
                    DeviceLog.find({EUI:device.id, fcnt:0}).sort({ts:-1}).exec(function(err, doc1){
                        if(err) console.log(err);
                        else{
                            if(doc1.length > 0){
                                var ts = doc1[0].ts;
                                DeviceLog.paginate({EUI:device.id, ts:{$gte:ts}},{page:1,sort: {'ts':-1},limit:1},function(err, doc2){
                                    if(err) console.log(err);
                                    else{
                                        var info = {};
                                        info.device = doc2.docs[0];
                                        info.name = device.name;
                                        info.tsInitial = ts;
                                        info.total = doc2.total;
                                        array.push(info);
                                        idx++;
                                        if(idx==json.result.length){
                                            //console.log(array)
                                            res.render('statistics', { title:'Statistics', info:JSON.stringify(array)});
                                        }
                                    }
                                })
                            }
                            else{
                                //try another approach
                                DeviceLog.find({EUI:device.id}).sort({fcnt:1, ts:1}).limit(10).exec(function(err, doc1){
                                    var ts = doc1[0].ts;
                                    DeviceLog.paginate({EUI:device.id, ts:{$gte:ts}},{page:1,sort: {'ts':-1},limit:1},function(err, doc2){
                                        if(err) console.log(err);
                                        else{
                                            var info = {};
                                            info.device = doc2.docs[0];
                                            info.name = device.name;
                                            info.tsInitial = ts;
                                            info.total = doc2.total;
                                            array.push(info);
                                            idx++;
                                            if(idx==json.result.length){
                                                //console.log(array)
                                                res.render('statistics', { title:'Statistics',info:JSON.stringify(array)});
                                            }
                                        }
                                    })
                                });
                                
                            }
                        }
                    })
                })
            }*/
            var deviceEUI = [];
            var exception = [];
            var device = [];
            var array = [];
            places.forEach(function(item){
                device[item.id] = {};
                device[item.id].name = item.name;
                deviceEUI.push(item.id);
                exception.push(item.id);
            })
            
            DeviceLog.find({EUI:{$in:deviceEUI}, fcnt:0},{__v:0,_id:0,port:0,ack:0,cmd:0}).sort({ts:-1}).exec(function(err, doc1){
                if(err) console.log(err)
                else{
                    //this one makes sure always get first document with fcnt 0
                    doc1.forEach(function(item){
                        //console.log(item.EUI);
                        if(!device[item.EUI].ts){
                            device[item.EUI].ts = item.ts;
                            exception.splice(exception.indexOf(item.EUI), 1);
                        }
                    })
                    //check if all device has ts initial, if not use another alternative
                    //console.log(exception)
                    Promise.all([
                        new Promise(function(resolve, reject){
                            if(exception.length > 0){
                                var idx = 0;
                                exception.forEach(function(item){
                                    DeviceLog.find({EUI:item},{__v:0,_id:0,port:0,ack:0,cmd:0}).sort({fcnt:1, ts:1}).limit(1).exec(function(err, doc1){
                                        if(err) console.log(err);
                                        else{
                                            device[doc1[0].EUI].ts = doc1[0].ts;
                                        }
                                        idx++;
                                        if(idx == exception.length)
                                            resolve(true);
                                    });
                                })
                            }
                            else
                                resolve(true);
                        })
                    ]).then(function(result){
                        //
                        var idx = 0;
                        //console.log(deviceEUI);
                        deviceEUI.forEach(function(item){
                            DeviceLog.paginate({EUI:item, ts:{$gte:device[item].ts}},{page:1,sort: {'ts':-1},limit:1},function(err, doc2){
                                if(err) console.log(err);
                                else{
                                    var info = {};
                                    info.device = doc2.docs[0];
                                    info.name = device[item].name;
                                    info.tsInitial = device[item].ts;
                                    info.total = doc2.total;
                                    array.push(info);
                                }
                                idx++;
                                if(idx==places.length){
                                    //console.log(array)
                                    res.render('statistics', { title:'Statistics',info:JSON.stringify(array)});
                                }
                            })
                        })
                    })
                    
                }
            })
    //res.send('Currently in Maintainence. Thank you.');  
    /*console.log(query);
    DeviceLog.paginate(query ,function(err, result) {
        // `posts` will be of length 100
        
        if(err) console.log(err);
        
        res.render('devices', { title:'Statistics', devices: JSON.stringify(result.docs) });
    });*/
});

function readJSONFile(filename, callback) {
  fs.readFile(filename, function(err, data) {
    if (err) {
      callback(err);
      return;
    }
    try {
      callback(null, JSON.parse(data));
    }
    catch (exception) {
      callback(exception);
    }
  });
}

module.exports = router;