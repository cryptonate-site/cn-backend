var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/api/alertbox/:key', function(req, res, next) {
  res.render('index', { alertboxKey: req.params.key });
});

module.exports = router;
