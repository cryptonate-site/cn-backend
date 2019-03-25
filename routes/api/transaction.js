const express = require('express');
const router = express.Router();
const Coinpayments = require('coinpayments');
const client = new Coinpayments(global.config.coinpayments);
const Validator = require("validate-params");

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
    if(global.config.coinpayments.useTempIPN !== undefined) {
        orderOut.ipn_url = global.config.coinpayments.useTempIPN;
    }
    //console.log("Sending in transaction.");
    client.createTransaction(orderOut, function (err, orderIn) {
        //console.log("Transaction CB fired");
        if(err) {
            res.status(500);
            res.json({"error": "Error received from Coinpayments", data: err});
            console.error(err);
            return;
        }
        global.database.pool.query("INSERT INTO `transactions` SET ?", {
            order_id: orderIn.txn_id,
            amount: orderIn.amount,
            currency: req.body.currency,
            to_email: req.params.foruser,
            from_user: req.body.from_user,
            order_status: 0
        }, function (err) {
            console.log("inserted stuff");
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
    global.database.pool.query("SELECT id FROM `transactions` WHERE order_id=? AND order_status IN (1,2)", [req.params.transactionid], function (error, results, fields) {
        if(error) {
            res.status(500);
            res.json({error: "Database error"});
	        console.error(error);
            return;
        }
        res.json({completed: results.length > 0});
    });
});
module.exports = router;
