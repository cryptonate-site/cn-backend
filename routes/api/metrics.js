/**
 * Created by ianot on 1/26/2018.
 */
const express = require('express');
const router = express.Router();
const Coinpayments = require('coinpayments');
const client = new Coinpayments(global.config.coinpayments);
const redis = require('redis');
const redis_connection = "";

router.post("/calculate_value", function (req, res) {

});

module.exports = router;
