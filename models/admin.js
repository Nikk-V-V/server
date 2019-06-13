const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminShema = new Schema({
    role: String, 
    password: String,
    phrases: {
        phras1:  String,
        phras2:  String,
        phras3:  String, 
        phras4:  String, 
    },
    slids: [{ type: Schema.Types.ObjectId, ref: 'Slids'}],
    orders: [{ type: Schema.Types.ObjectId, ref: 'Orders'}],
    created: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Admin', AdminShema);