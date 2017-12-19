const mysql = require("mysql");

class Database {
    constructor(dbConfig) {
        console.log(dbConfig);
        this.pool = mysql.createPool(dbConfig);
        this.pool.on('connect', function (e, i) {
            console.log(e);
            console.log(i);
        });
    }

    testStuff() {
        var start = Date.now();
        var meme = mysql.createConnection(global.config.db);
        meme.query("SELECT COUNT(id) FROM `transactions`;", function (err, results, fields) {
            console.log(err);
            console.log(results);
            console.log("End Time: " + (Date.now() - start));
        });
        meme.query("SELECT COUNT(id) FROM `transactions`;", function (err, results, fields) {
            console.log(err);
            console.log(results);
            meme.end();
            console.log("End Time: " + (Date.now() - start));
        });
    }
}

module.exports = Database;