var express = require('express');
var router = express.Router();
var DeviceLog = require('../app/models/deviceLog');

/* GET users listing. */
router.get('/', function(req, res, next) {
    console.log(req.query);
    var query = {};
    var page = 1;
    if(req.query.page)
        page = req.query.page;
    
    if(req.query.place){
        var str = req.query.place;
        var idx = str.indexOf('string:');
        if(idx!=-1)
            str = str.substring(idx+7)
        console.log(str);
        query.EUI = str;
        req.query.place = str;
    }
    if(req.query.startDate||req.query.endDate){
        query.ts = {};
        if(req.query.startDate){
            query.ts['$gte'] = parseInt(req.query.startDate)
            if(req.query.startTime){
                query.ts['$gte'] += parseInt(req.query.startTime)
            }
        }
        if(req.query.endTime){
            query.ts['$lt'] = parseInt(req.query.startDate) + parseInt(req.query.endTime);
        }
        else{
            query.ts['$lt'] = parseInt(req.query.startDate) + 24*3600*1000;
        }
    }
    
    console.log(query);
    DeviceLog.paginate(query,{ page: page, sort: {'ts':-1}, limit: 100 },function(err, result) {
        // `posts` will be of length 100
        var pagination = {
            totalItems: result.total,
            itemsPerPage: result.limit,
            currentPage: result.page,
        }
        console.log(pagination);
        if(err) console.log(err);
        res.render('devices', { title:'History', pagination: JSON.stringify(pagination), data:JSON.stringify(req.query), devices: JSON.stringify(result.docs) });
    });
});

module.exports = router;
