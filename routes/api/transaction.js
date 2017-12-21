const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const uuidv1 = require('uuid/v1');
const Coinpayments = require('coinpayments');
const client = new Coinpayments(global.config.coinpayments);
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
        console.log(req.body.amount);
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
        currency1: req.body.currency,
        currency2: req.body.currency,
        buyer_name: req.body.from_user,
        buyer_email: req.body.from_email,
        custom: req.body.message,
        item_name: req.params.foruser
    };
    client.createTransaction(orderOut, function (err, orderIn) {
        if(err) {
            res.status(500);
            res.json({"error": "Error received from Coinpayments", data: err});
            console.error(err);
            return;
        }
        global.database.pool.query("INSERT INTO `transactions` SET ?", {
            order_id: orderIn.txn_id,
            amount: orderIn.amount,
            currency: req.body.currency2,
            to_email: req.params.foruser,
            order_status: 0
        }, function (err) {
            if(err) console.error(err);
        });
        var responseData = {
            orderId: orderIn.txn_id,
            send_to: orderIn.address,
            recpt_url: orderIn.status_url,
            timeout: orderIn.timeout
        };
        res.json(responseData);
    });
});

router.get("/is-complete/:transactionid", function (req, res, next) {
    //TODO: Update to new DB schema
    global.database.pool.query("SELECT id FROM `completed_orders` WHERE order_id=?", [req.params.transactionid], function (error, results, fields) {
        if(error) {
            res.status(500);
            res.json({error: "Database error"});
            return;
        }
        res.json({completed: results.length > 0});
    });
});
module.exports = router;