const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  city: String,
  newPostOffice: Number,
  totalPrice: { type: Number, default: 0 },
  products: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 }
  }],
  status: {type: String, default: 'Прийнято'},
  email: String,
  name: String,
  telephone: Number
});

OrderSchema.plugin(deepPopulate);

module.exports = mongoose.model('Order', OrderSchema);
