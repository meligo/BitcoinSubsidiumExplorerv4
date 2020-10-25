var request = require('request');

var _ = require('lodash');

var base_url = 'https://api.birake.com/v5/public';

function get_summary(coin, exchange, cb) {
    var req_url = base_url + '/ticker';
    request({ uri: req_url, json: true }, function (error, response, body) {
        var index = _.findIndex(body, function (o) { return o.tradingPairs ==  'XBTX_TELOS'; });
        var pair = body[index];
        if (pair) {
            return cb(null, pair)
        } else {
            return cb('Pair not found ' + 'XBTX_TELOS', body[0], null);
        }
    });
}

function get_trades(coin, exchange, cb) {
    var req_url = base_url + '/trades/?pair=XBTX_TELOS';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body.length < 1) {
            return cb('Pair not found ' + 'XBTX_TELOS', null)
        } else {
            return cb(null, body);
        }
    });
}

function get_orders(coin, exchange, cb) {
    var req_url = base_url + '/depth/?pair=XBTX_TELOS';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body.buys && body.sells) {
            return cb(null, body.buys, body.sells);
        } else {
            return cb('Pair not found ' + 'XBTX_TELOS', [], []);
        }
    });
}

module.exports = {
    get_data: function (coin, exchange, cb) {
        var error = null;
        get_orders(coin, exchange, function (err, buys, sells) {
            if (err) { error = err; }
            get_trades(coin, exchange, function (err, trades) {
                if (err) { error = err; }
                get_summary(coin, exchange, function (err, stats) {
                    if (err) { error = err; }
                    return cb(error, { buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats });
                });
            });
        });
    }
};
