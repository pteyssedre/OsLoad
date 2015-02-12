/**
 * Created by pteyssedre on 2/10/2015.
 */
var rest = require("restify"),
    colors = require('colors/safe');

module.exports = function() {
    var self = this;
    self._logger = undefined;
    self._server = undefined;
    self.Log = {
        _level: 9,
        i: function () {
            if (this._level >= 3) {
                this._l(arguments, "grey", "INFO");
            }
        },
        d: function () {
            if (this._level >= 2) {
                this._l(arguments, "green", "DEBUG");
            }
        },
        w: function () {
            if (this._level >= 1) {
                this._l(arguments, "yellow", "WARN");
            }
        },
        e: function () {
            if (this._level >= 0) {
                this._l(arguments, "red", "ERROR");
            }
        },
        _l: function (argts, color, hint) {
            var data = "";
            for (var args in argts) {
                var obj = argts[args];
                if ((typeof  obj) === "object") {
                    data += JSON.stringify(obj).trim() + " ";
                } else {
                    data += obj + " ";
                }
            }
            console.log(colors[color](hint), colors[color](new Date()), colors[color](data.trim()))
        }
    };
    self._add = function (req, resp, next) {

    };
    self.InitServer = function (port) {
        if (isNaN(Number(port))) {
            port = 9898;
        }
        self._server = rest.createServer();
        self._server.use(rest.bodyParser());
        self._server.post("/add", self._add);
        self._server.listen(port, function () {
            self.Log.i("REST Services started on port", port);
        });
        self._unknownMethodHandler = function (req, res) {
            self.Log.e("REST unknownMethodHandler call", req.connection.remoteAddress, req.connection.remotePort);
            return res.send(404)
        };
        self._server.on('MethodNotAllowed', self._unknownMethodHandler);
    };

    return self;
};