/**
 * Created by ianot on 1/26/2018.
 */
const express = require('express');
const router = express.Router();
const Coinpayments = require('coinpayments');
const client = new Coinpayments(global.config.coinpayments);
const mcache = require("memory-cache");

const calculate_value = (res, currencies) => {
    let total_btc = 0;
    let total = 0;
    let calc_to_btc = (from_currency, from_amt) => {
        if(res[from_currency]) {
            total_btc += res[from_currency].rate_btc * from_amt;
        }
    };
    let calc_to_fiat = () => {
        total += total_btc / res.USD.rate_btc;
    };

    currencies.forEach(function (val) {
       calc_to_btc(val.currency, val.amount);
    });
    calc_to_fiat();
    return total;
};

router.post("/calculate_value", function (req, res) {
    let key = "__metrics__valuecache";
    if(res.body.currencies) {
        let cachedBody = mcache.get(key);
        if (!cachedBody) {
            client.rates({short: 1, accepted: 1}, function (err, res) {
                mcache.put(key, res, 300 * 1000);
                let total = calculate_value(cachedBody, req.body.currencies);
                res.json({"amt": total});
            });
        } else {
            let total = calculate_value(cachedBody, req.body.currencies);
            res.json({"amt": total});
        }
    } else {
        res.json({"error": "missing argument"});
    }
});



module.exports = router;
