const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const uuidv1 = require('uuid/v1');
const Client = require('coinbase').Client;
const client = new Client(global.config.coinbase);
const Validator = require("validate-params");
const crypto = require('crypto');
/*
var temp = function fun() {
    global.database.pool.getConnection(function (err, connection) {
        if(err) {
            res.status(500);
            res.json({error: "Failed to connect to database", data: err});
            return;
        }

        //(`uuid`, `to_email`, `amount`, `currency`, `from_email`, `from_name`, `message`)
        var uuid = uuidv1();
        var toInsert = {
            uuid: uuid,
            to_email: "test@test.com",
            amount: 0.0001,
            currency: "TCC",
            from_email: "test@customer.com",
            from_name: "memerman",
            message: "this is a test email"
        };

        connection.query("INSERT INTO `transactions` SET ?", toInsert, function (error, results, fields) {
            if(error) {
                res.status(500);
                res.json({error: "Database threw error"});
                return;
            }
            res.json({
                uuid: uuid
            });
        });
        connection.release();
    });
}
*/

/**
 * Transaction Flow Documentation:
 *
 * General Flow:
 *  1. start-flow: Flow session UUID generated.
 *  Links remainder of steps to desired stream account along with other transaction details.
 *
 *  2. in-notify: Coinbase notification URL incoming
 *  Looks for correct IP, notification details, and UUID info. If it matches a transaction,
 *  do post to streamer notifier.
 */

/* GET users listing. */
router.post('/start-flow/:foruser', function(req, res, next) {
    // req.params.foruser
    try {
        Validator.assert.arg(req.params.foruser, 'string');
        Validator.assert.args(req.body, {
            amount: "number",
            currency: "string",
            from_user: "string",
            from_email: "string",
            message: "string"
        });
    } catch(e) {
        res.status(400);
        res.json({"error": "Missing/incorrect data in request body", data: e.message});
        return;
    }
    var orderOut = {
        amount: req.body.amount,
        currency: req.body.currency,
        name: "Donation for " + req.params.foruser,
        description: "A donation for " + req.params.foruser,
        metadata: {
            for_user: req.params.foruser,
            from_user: req.body.from_user,
            from_email: req.body.from_email,
            message: req.body.message
        }
    }
    client.createOrder(orderOut, function (err, orderIn) {
        if(err) {
            res.status(500);
            res.json({"error": "error received from coinbase", data: err.message});
            console.error(err);
            return null;
        }
        var responseData = {
            orderId: orderIn.data.id,
            send_to: orderIn.data.bitcoin_address,
            btc_uri: orderIn.data.bitcoin_url,
            recpt_url: orderIn.data.receipt_url
        };
        res.json(responseData);
    });
});

router.get("/is-complete/:transactionid", function (req, res, next) {
    global.database.pool.query("SELECT id FROM `completed_orders` WHERE order_id=?", [req.params.transactionid], function (error, results, fields) {
        if(error) {
            res.status(500);
            res.json({error: "Database error"});
            return;
        }
        res.json({completed: results.length > 0});
    });
});

router.post("/coinbase-in", function (req, res, next) {
    if(client.verifyCallback(req.body_raw, req.get("CB-SIGNATURE"))) {
        if(req.body.type == "wallet:orders:paid") {
            var orderData = req.body.data.resource;
            global.database.pool.query("INSERT INTO `completed_orders` SET ?", {
                order_id: orderData.id
            });
            res.end();
        }
    } else {
        res.status(500);
        res.json({"error": "failed to verify coinbase response"});
        return;
    }
});

module.exports = router;