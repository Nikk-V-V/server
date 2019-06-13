"use strict";

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const checkJWT = require('../middlewares/check-jwt');
const Slids = require('../models/slids');
const multer = require('multer');
const async = require('async');
const Admin = require('../models/admin');
const config = require('../config');
const nodemailer = require("nodemailer");
const Order = require('../models/order');


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


  
    router.route('/phrases')
      .get((req, res, next) => {
        Admin.findOne({},(err, admin) => {
          res.json({
            success: true,
            phrases: admin.phrases,
            message: "Successful"
          });
        });
      })
      .post((req, res, next) => {
        Admin.findOne({}, (err, admin) => {
          
          if (err) return next(err);
    
          if (req.body.phras1) admin.phrases.phras1 = req.body.phras1;
          if (req.body.phras2) admin.phrases.phras2 = req.body.phras2;
          if (req.body.phras3) admin.phrases.phras3 = req.body.phras3;
          if (req.body.phras4) admin.phrases.phras4 = req.body.phras4;
         
          admin.save();
          res.json({
            success: true,
            message: 'Успішно оновлено'
          });
        });
      });
      
      router.route('/slids')
        .get((req, res, next) => {
          Slids.find({},(err, slids) => {
            res.json({
              success: true,
              slids: slids,
              message: "Successful"
            });
          });
        })
        .post([checkJWT, upload.single('images')], (req, res, next) => {
          let slids = new Slids();
            slids.slid = `http://localhost:3030/${req.file.path}`;

            slids.save();
            res.json({
              success: true,
              message: "Успішно додано відгук"
            });
        })

      router.post('/role', (req, res, next) => {
        let admin = new Admin();
        admin.role = req.body.role;
        admin.password = req.body.password;
    
        Admin.findOne({ email: req.body.role }, (err, existingAdmin) => {
         if (existingAdmin) {
           res.json({
             success: false,
             message: 'Account with that email is already exist'
           });
         } else {
          admin.save();
           var token = jwt.sign({
            admin: admin
           }, config.secret, {
             expiresIn: '7d'
           });
           res.json({
             success: true,
             message: 'Enjoy your token',
             token: token
           });
         }
        });
       });

       router.post('/autorisation', (req, res, next) => {

        Admin.findOne({ role: req.body.role }, (err, admin) => {
          if (err) throw err;
      
          if (!admin) {
            res.json({
              success: false,
              message: 'Authenticated failed, User not found'
            });
          } else if (admin) {
            var validPassword = admin.password;
            if (!validPassword) {
              res.json({
                success: false,
                message: 'Authentication failed. Wrong password'
              });
            } else {
              var token = jwt.sign({
                admin: admin
              }, config.secret, {
                expiresIn: '7d'
              });
      
              res.json({
                success: true,
                mesage: "Enjoy your token",
                token: token
              });
            }
          }
        });
      });

      router.route('/adminka')
        .get(checkJWT, (req, res, next) => {
          Admin.findOne({ _id: req.decoded.admin._id }, (err, admin) => {
            res.json({
              success: true,
              admin: admin,
              message: "Успіх"
            });
          });
        });

       
        router.route('/orders')
          .get(checkJWT, (req, res, nex) => {
            Order.find({}, (err, order) => {
              res.json({
                success: true,
                order: order,
                message: "Успіх"
              })
            })
          })
          .post(checkJWT, (req, res, nex) => {
            Order.findOne({}, (err, order) =>{

              if(req.body.status) order.status = req.body.status;

              let message = `Шановний ${order.name}, ми надіслали вам ваше замовлення.`;

              let mailOption = {
                from: `"To Wolf 🐺" <${config.user}>`, 
                to: `${order.email}, ${config.user}`, 
                subject: "Дякуємо за замовлення", 
                text:'',
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
            })
          });
       
        


    module.exports = router;