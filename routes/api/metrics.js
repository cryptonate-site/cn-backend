/**
 * Created by ianot on 1/26/2018.
 */
const express = require('express');
const router = express.Router();
const Coinpayments = require('coinpayments');
const client = new Coinpayments(global.config.coinpayments);
const redis = require("redis").createClient({
    host: global.config.redis.host,
    port: global.config.redis.port,
    db: global.config.redis.cache_db
});

const calculate_value = (res, currencies) => {
    let total_btc = 0;
    let total = 0;
    console.log(res);
    console.log(currencies);
    let calc_to_btc = (from_currency, from_amt) => {
        if(res[from_currency]) {
            total_btc += res[from_currency].rate_btc * from_amt;
        }
    };
    let calc_to_fiat = () => {
        total += total_btc / res[currencies.to_currency].rate_btc;
    };

    currencies.currencies.forEach(function (val) {
       calc_to_btc(val.currency, val.amount);
    });
    calc_to_fiat();
    return total;
};

router.post("/calculate_value", function (req, res) {
    let key = "__metrics__valuecache";
    if(req.body && req.body.currencies && req.body.to_currency) {
        redis.get(key, function(err, val) {
            if(err || !val) {
                client.rates({short: 1, accepted: 1}, function (err, cpres) {
                    if (err) {
                        console.err("Error From CP: " + err);
                        res.json({"amt": "0", "msg": "backend failure"});
                        return;
                    }
                    redis.setex(key, 300, JSON.stringify(cpres));
                    let total = calculate_value(cpres, req.body);
                    res.json({"amt": total});
                });
            } else {
                let total = calculate_value(JSON.parse(val), req.body);
                res.json({"amt": total});
            }
        });
    } else {
        res.json({"error": "missing argument"});
    }
});



module.exports = router;
