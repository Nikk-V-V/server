"use strict";

const router = require('express').Router();
const algoliasearch = require('algoliasearch');
const client = algoliasearch('SU3AEYQWGG', 'cecb46f835d60027bedcc0c2e7baff31');
const index = client.initIndex('shop');



router.get('/', (req, res, next) => {
  if (req.query.query) {
    index.search({
      query: req.query.query,
      page: req.query.page,
    }, (err, content) => {
      res.json({
        success: true,
        message: "Here is your search",
        status: 200,
        content: content,
        search_result: req.query.query
      });
    });
  }
});


module.exports = router;

