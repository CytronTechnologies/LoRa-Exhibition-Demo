var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var DeviceLogSchema = new Schema({
   cmd:{
      type: String
   },
   EUI: {
      type: String
   },
   ts:{
      type: Number  
   },
   fcnt: {
      type: Number
   },
   port: {
      type: Number
   },
   ack:{
      type: Boolean
   },
   data:{
      type: String
   }
});

DeviceLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('DeviceLog', DeviceLogSchema);