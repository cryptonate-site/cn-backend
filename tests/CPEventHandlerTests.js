const CPEventHandler = require("../lib/coinpayments-events");
const CPEvents = new CPEventHandler();
const Coinpayments = require("coinpayments");

global.config = require("../settings.json");
var Database = require("../lib/database");
global.database = new Database(global.config.db);


Coinpayments.events.emit("ipn_complete", {
    item_name: 11,
    currency2: "ltct",
    received_amount: 1
});