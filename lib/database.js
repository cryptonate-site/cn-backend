const mysql = require("mysql");

class Database {
    constructor(dbConfig) {
        this.pool = mysql.createPool(dbConfig);
    }
}

module.exports = Database;