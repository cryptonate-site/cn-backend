const express = require('express');
const router = express.Router();
const transaction = require('./api/transaction');
const metrics = require('./api/metrics');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({"description": "cryptonate api", "version": "1.0.0"});
});

router.use('/transaction', transaction);
router.use('/metrics', metrics);

module.exports = router;
