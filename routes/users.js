var express = require('express');
var router = express.Router();
var transaction = require('./api/transaction');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({"description": "cryptonate api", "version": "1.0.0"});
});

router.use('/transaction', transaction);

module.exports = router;
