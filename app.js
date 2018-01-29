var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

global.config = require("./settings.json");
var Database = require("./lib/database");
global.database = new Database(global.config.db);

var index = require('./routes/index');
var users = require('./routes/users');

var Coinpayments = require('coinpayments');
var app = express();

var CPEvents = require('./lib/coinpayments-events');

var events = new CPEvents();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(function (req, res, next) {
    if(req.url.toLowerCase() === '/ipn') {
        req.rawBody = '';
        req.on("data", function (chunk) {
            req.rawBody += chunk;
        });
    }
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api', users);

app.use("/ipn",
    [ Coinpayments.ipn({
        merchantId: global.config.coinpayments.merchId,
        merchantSecret: global.config.coinpayments.merchSecret,
        rawBodyIndex: "rawBody"
    }), function (req, res, next) {
        res.status(200);
        res.end();
    }]);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    if(req.app.get('env') === 'development') {
        console.error(err);
    }
    // render the error page
    res.status(err.status || 500);
    if(req.url.includes("/api")) {
        res.json({"error": "Internal Server Error", "message": err.message});
    } else {
        res.render('error');
    }
});

module.exports = app;
