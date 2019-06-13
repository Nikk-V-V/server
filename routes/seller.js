"use strict";

const router = require('express').Router();
const Product = require('../models/product');
const multer = require('multer');
const path = require('path');

const checkJWT = require('../middlewares/check-jwt');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null,  './upload');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now().toPrecision() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});



router.route('/products')
  .get(checkJWT, (req, res, next) => {
    Product.find({ owner: req.decoded.user._id })
      .populate('owner')
      .populate('category')
      .exec((err, products) => {
        if (products) {
          res.json({
            success: true,
            message: "Products",
            products: products
          });
        }
      });
  })
  .post([checkJWT, upload.single('images')], (req, res, next) => {
    let product = new Product();
    product.owner = req.decoded.user._id;
    product.category = req.body.categoryId;
    product.title = req.body.title;
    product.price = req.body.price;
    product.mark = req.body.markId;
    product.description = req.body.description;
    product.image =  `http://localhost:3030/${req.file.path}`;
    product.save();
    res.json({
      success: true,
      message: 'Successfully Added the product'
    });
  });




module.exports = router;
