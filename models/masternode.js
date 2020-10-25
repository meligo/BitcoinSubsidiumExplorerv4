var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var MNSchema = new Schema({
  createdAt: { type: Date, expires: 86400, default: Date.now()},
  addr: { type: String, unique: true},
  ip: { type: String, default: "" },
  country: { type: String, default: ""},
  flag:{type:String,default:""}
});

module.exports = mongoose.model('Masternode', MNSchema);