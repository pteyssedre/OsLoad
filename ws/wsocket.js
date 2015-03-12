/**
 * Created by pteyssedre on 3/12/2015.
 */
var websocket = require("nodejs-websocket"),
    UAParser = require('ua-parser-js'),
    colors = require('colors/safe');

var WS = {
    Log: {
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
    },
    Socket: {
        s4: function () {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        },
        /**
         * @return {string}
         */
        GUID: function () {
            return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4();
        },
        /**
         * @private
         */
        _lib: websocket,
        /**
         * @private
         */
        _parse: UAParser,
        /**
         * @private
         */
        _mode: "server",
        /**
         * @private
         */
        _config: {
            host: "",
            port: 0,
            protocol: "ws"
        },
        /**
         * @private
         */
        _clients: [],
        /**
         * Initialization of the {@link WS#Socket} object.
         * @param options
         * @returns {WS}
         */
        Init: function (options) {
            WS.Log.d("Initialization of the socket");
            this._parseOpts(options);
            switch (this._mode) {
                case "server":
                    this._clients = [];
                    this._server = this._lib.createServer(this._OnClientConnect).listen(this._config.port);
                    break;
                case "client":
                    break;
                case "hybrid":
                    break;
            }
            return this;
        },
        /**
         * Callback function call at each new connection.
         * @param {string} uid
         * @param {int} index
         */
        OnNewClient: function (uid, index) {

        },
        /**
         * Helper to parse the options send to the {@link WS#Init} method.
         * @param {Object} options
         * @private
         */
        _parseOpts: function (options) {
            if (options) {
                this._mode = options["mode"] ? options["mode"] : "server";
                if (this._mode == "client") {
                    this._config.protocol = options["protocol"] ? options["protocol"] : "ws";
                    this._config.host = options["host"] ? options["host"] : "";
                    this._config.port = options["port"] ? options["port"] : 0;
                }
            }
        },
        /**
         * At each new client connection through the WebSocket server this function will be called.
         * We add the Connection Object to the {@link WS#_clients} array and add listener to it.
         * A notification could be push through {@link WS#OnNewClient} method.
         * @param {Object} connection
         * @private
         */
        _OnClientConnect: function (connection) {
            WS.Log.d("New client connection id:", connection.key);
            connection.UID = this.GUID();
            var index = this._clients.push(connection) - 1;
            this._addListener(index);
            this.OnNewClient(connection.UID, index);
        },
        /**
         * Shortcut function to add listener on the Connection Object the method "TEXT" and "CLOSE".
         * @param {int} index
         * @private
         */
        _addListener: function (index) {
            var con = this._clients[index];
            con.on("text", function (strMessage) {
                WS.Log.d("New client message id:", con.key);
                //TODO: client should subscribe to messaging relay
            });
            con.on("close", function (code, reason) {
                WS.Log.d("New client disconnect id:", con.key);
                //TODO:Stop messaging relay
            });
        }
    }
};

module.exports = WS;