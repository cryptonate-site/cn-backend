const Coinpayments = require('coinpayments');
const SocketManager = require('./socket-manager');

class CPEventHandler {

    constructor() {
        Coinpayments.events.on("ipn_pending", this.pending);
        Coinpayments.events.on("ipn_complete", this.success);
        Coinpayments.events.on("ipn_fail", this.fail);
    }

    fail(data) {
        console.log("Transaction failed for user: " + data.item_name);
        global.database.pool.query("UPDATE `transactions` SET order_status=? WHERE order_id=?", [-1, data.txn_id], function(err, res) {
            if(err) {
                console.error("Failed to set failed status for txn");
                console.error(err);
            }
        });
    }

    pending(data) {
        if(data.amount2 === data.received_amount) {
            console.log("Pre-emptively sending payment notification to streamer " + data.item_name);
            global.database.pool.query("UPDATE `transactions` SET order_status=? WHERE order_id=? AND order_status < 1", [1, data.txn_id], function (err, res) {
                if(err) {
                    console.error("Warning: failed to set transaction status to IN_PROGRESS");
                    console.error(err);
                }
            });
            global.database.pool.query("SELECT users.alertboxApiKey, alertbox_settings.image FROM `users` INNER JOIN alertbox_settings ON users.id=alertbox_settings.user_id WHERE users.id=?", [data.item_name], function (err, res) {
                if(err) {
                    console.error("error in sql");
                    return;
                }
                var imageURL = "";
                if(res[0].image.length === 0) {
                    imageURL = res[0].image;
                } else {
                    imageURL = "/img/" + data.currency2.toLowerCase();
                }
                SocketManager.instance.socketManager.to(res[0].alertboxApiKey).emit("payment",
                    {
                        from: data.buyer_name,
                        amount: data.amount2,
                        currency: data.currency2,
                        message: data.custom,
                        image: imageURL
                    });
            });
        }
    }

    success(data) {
        console.log("Confirming order for streamer " + data.item_name);
        //TODO: Consolidate to one transaction (aka getConnection)
        global.database.pool.query("UPDATE `transactions` SET order_status=?, txid=? WHERE order_id=?", [2, data.send_tx, data.txn_id], function (err, res) {
            if(err) {
                console.error(err);
            }
            var currency = data.currency2.toLowerCase().slice(0, 5);
            var updateTo = [
                currency,
                data.net,
                data.item_name
            ];
            global.database.pool.query("UPDATE `ledgers` SET ?? = ? WHERE `user_id` = ?", updateTo, function (err, res) {
                if(err) {
                    console.error("ERROR!");
                    console.error(err);
                }
            });
        });
    }
}

module.exports = CPEventHandler;
