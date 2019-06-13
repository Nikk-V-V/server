const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SlidsShema = new Schema({
    slid: String,
});

module.exports = mongoose.model('Slids', SlidsShema);