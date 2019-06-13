"use strict";

const router = require('express').Router();
const async = require('async');
const stripe = require('stripe')('sk_test_ot4JCDk5kT1zbiUfhmZ3rjwU002PrHhoBZ');
const Category = require('../models/category');
const Product = require('../models/product');
const Review = require('../models/review');
const Order = require('../models/order');
const Mark = require('../models/mark')
const checkJWT = require('../middlewares/check-jwt'); 
const nodemailer = require("nodemailer"); 
const config = require('../config');
const xoauth2 = require('xoauth2')

const  smtpTransport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
      type: config.type,
      user: config.user,
      clientId: config.clientId ,
      clientSecret: config.clientSecret ,
      refreshToken: config.refreshToken,
      accessToken: config.accessToken
  }, 
});

router.get('/products', (req, res, next) => {
  const perPage = 10;
  const page = req.query.page;
  async.parallel([
    function(callback) {
      Product.count({}, (err, count) => {
        var totalProducts = count;
        callback(err, totalProducts);
      });
    },
    function(callback) {
      Product.find({})
        .skip(perPage * page)
        .limit(perPage)
        .populate('category')
        .populate('owner')
        .exec((err, products) => {
          if(err) return next(err);
          callback(err, products);
        });
    }
  ], function(err, results) {
    var totalProducts = results[0];
    var products = results[1];
   
    res.json({
      success: true,
      message: 'category',
      products: products,
      totalProducts: totalProducts,
      pages: Math.ceil(totalProducts / perPage)
    });
  });
  
});


router.route('/categories')
  .get((req, res, next) => {
    Category.find({}, (err, categories) => {
      res.json({
        success: true,
        message: "Успішно",
        categories: categories
      });
    });
  })
  .post((req, res, next) => {
    let category = new Category();
    category.name = req.body.category;
    category.save();
    res.json({
      success: true,
      message: "Успішно"
    });
  });
  


  router.get('/categories/:id', (req, res, next) => {
    const perPage = 12;
    const page = req.query.page;
    async.parallel([
      function(cb) {
        Product.estimatedDocumentCount({ category: req.params.id }, (err, count) => {
          var totalProducts = count;
          cb(err, totalProducts);
        });
      },
      function(cb) {
        Product.find({ category: req.params.id })
          .skip(perPage * page)
          .limit(perPage)
          .populate('category')
          .populate('owner')
          .populate('reviews')
          .exec((err, products) => {
            if(err) return next(err);
            cb(err, products);
          });
      },
      function(callback) {
        Category.findOne({ _id: req.params.id }, (err, category) => {
         callback(err, category);
        });
      }
    ], function(err, results) {
      var totalProducts = results[0];
      var products = results[1];
      var category = results[2];
      res.json({
        success: true,
        message: 'category',
        products: products,
        categoryName: category.name,
        totalProducts: totalProducts,
        pages: Math.ceil(totalProducts / perPage)
      });
    });
    
  });

  router.route('/allProduct')
    .get((req, res, next) => {
      Product.find({}, (err, product) => {
        res.json({
          success: true,
          message: "Успіх",
          product: product
        });
      });
    });

  router.route('/marks')
  .get((req, res, next) => {
    Mark.find({}, (err, marks) => {
      res.json({
        success: true,
        message: "Успіх",
        marks: marks
      });
    });
  })
  .post((req, res, next) => {
    let mark = new Mark();
    mark.name = req.body.mark;
    mark.save();
    res.json({
      success: true,
      message: "Успішно"
    });
  });

  router.get('/product/:id', (req, res, next) => {
    Product.findById({ _id: req.params.id })
      .populate('category')
      .populate('owner')
      .deepPopulate('reviews.owner')
      .exec((err, product) => {
        if (err) {
          res.json({
            success: false,
            message: 'Продукт не знайдено'
          });
        } else {
          if (product) {
            res.json({
              success: true,
              product: product
            });
          }
        }
      });
  });


  router.post('/review', checkJWT, (req, res, next) => {
    async.waterfall([
      function(callback) {
        Product.findOne({ _id: req.body.productId}, (err, product) => {
          if (product) {
            callback(err, product);
          }
        });
      },
      function(product) {
        let review = new Review();
        review.owner = req.decoded.user._id;

        if (req.body.title) review.title = req.body.title;
        if (req.body.description) review.description = req.body.description;
        review.rating = req.body.rating;

        product.reviews.push(review._id);
        product.save();
        review.save();
        res.json({
          success: true,
          message: "Успішно додано відгук"
        });
      }
    ]);
  });


router.post('/payment', checkJWT, (req, res, next) => {
  const products = req.body.products;
    
  let order = new Order();
  order.owner = req.decoded.user._id;
  order.totalPrice = req.body.totalPrice;
  order.city = req.body.order.city;
  order.newPostOffice = req.body.order.newPostOffice;
  order.email = req.body.order.email;
  order.name = req.body.order.owner;
  order.telephone = req.body.order.telephone;
  order.status = req.body.status;

  products.map(product => {
    order.products.push({
      product: product.product,
      quantity: product.quantity
    });
  });

  let message = `<p>Привіт, ${order.name}.</p>`;
  message += `<p>Ви замовили товар на суму ${order.totalPrice}грн.</p>`;
  message += '<hr>';
  message += `<p>Дякуємо, що обрали нас.</p>`;

  let mailOption = {
    from: `"To Wolf 🐺" <${config.user}>`, 
    to: `${order.email}, ${config.user}`, 
    subject: "Дякуємо за замовлення", 
    text: `Привіт, ${order.name}.
    Ви замовили в нашому магазині товар на ${order.totalPrice}гривень.
    Дякуємо за те що обрали нас`, 
    html:  `${message}`
  }

  smtpTransport.sendMail(mailOption, (err, res) => {
    if(err) {
      console.log(err);
    } else {
      console.log('Лист відправлено')
    }
  });
    
  order.save();
  res.json({
    success: true,
    message: "Успішно"
  });
});

module.exports = router;