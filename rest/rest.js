/**
 * Created by pteyssedre on 2/10/2015.
 * @version 1.1
 */
var rest = require("restify"),
    colors = require('colors/safe');

module.exports = function () {
    var self = this;
    self._logger = undefined;
    self._regType = ["user", "device", "machine"];
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
    /**
     * REST Service Add Method will allow a login USER to register devices or clients which will be linked to this USER.
     * This method is now anonymous but it could be protected through API Token in order to allow only specific clients to register into the system.
     *
     * @param {object} req
     * @param {object} resp
     * @param {function} next
     * @private
     */
    self._add = function (req, resp, next) {

    };
    /**
     * REST Service Authentication Method will allow clients to submit credentials in order to validate an USER.
     * This method is now anonymous but it could be protected through API Token in order to allow only specific clients to register into the system.
     *
     * @param {object} req
     * @param {object} resp
     * @param {function} next
     * @private
     */
    self._authentication = function (req, resp, next) {
        rest.Log.d("New Request authentication");
        if (req.params && req.params.credentials) {
            var cred;
            try {
                cred = JSON.parse(req.params.credentials);
            } catch (exception) {
                rest.Log.e("Unable to process user for authentication", exception);
                resp.send(404, {type: 2, code: -1, valid: false, message: "Not found"});
                return next();
            }
            if (self.OnUserAuthentication) {
                self.OnUserAuthentication(cred, function (success) {
                    resp.send(200, success);
                    return next();
                }, function (fail) {
                    resp.send(500, fail);
                    return next();
                });
            }
        } else {
            resp.send(404, {type: 2, code: -1, valid: false, message: "Not found"});
            return next();
        }
    };
    /**
     * Application callback made to validate the credentials of an USER during the private <code>authentication</code> method.
     *
     * @param {object} credential
     * @param {function} onSuccess
     * @param {function} onFailure
     */
    self.OnUserAuthentication = function (credential, onSuccess, onFailure) {
        if (onSuccess) {
            onSuccess("OK");
        } else if (onFailure) {
            onFailure("NOK")
        }
    };
    /**
     *
     * @param {object} data
     * @param {function} onFailure
     * @private
     */
    self._regParseData = function(data,onFailure){
        var d;
        try {
            d = JSON.parse(data);
        } catch (exception) {
            if(onFailure){
                onFailure(exception);
            }
            return;
        }
        return d;
    };
    /**
     * REST Service Registration Method can support multiple type of registration define into the private array <code>regType</code>.
     * This method is now anonymous but it could be protected through API Token in order to allow only specific clients to register into the system.
     *
     * @param {object} req
     * @param {object} resp
     * @param {function} next
     * @private
     */
    self._register = function (req, resp, next) {
        rest.Log.d("New Request register");
        if (req.params && req.params.type && !isNaN(Number(req.params.type))
            && (Number(req.params.type) == 0 || Number(req.params.type) < self._regType.length)) {
            var _regT = self._regType[req.params.type];
            rest.Log.d("Register request arrived", _regT);
            var data = self._regParseData(req.params[_regT], function(exception){
                rest.Log.e("Unable to process "+_regT+" for registration", exception);
                resp.send(404, {type: 0, code: -1, valid: false, message: "Not found"});
                return next();
            });
            switch (_regT) {
                case "user":
                    self.OnUserRegistration(data, function (success) {
                        resp.send(200, success);
                        return next();
                    }, function (fail) {
                        resp.send(500, fail);
                        return next();
                    });
                    break;
                case "device":
                    self.OnDeviceRegistration(data, function (success) {
                        resp.send(200, success);
                        return next();
                    }, function (fail) {
                        resp.send(500, fail);
                        return next();
                    });
                    break;
                case "machine":
                    self.OnMachineRegistration(data, function (success) {
                        resp.send(200, success);
                        return next();
                    }, function (fail) {
                        resp.send(500, fail);
                        return next();
                    });
                    break;
            }
        } else {
            rest.Log.d("Register request does not contain any valid type");
            resp.send(404);
            return next();
        }
    };
    /**
     * Application callback use to allow an independent data provider from this REST service to register an USER.
     * This function MUST have a success callback AND a error callback.
     *
     * @param {object} user
     * @param {function} onSuccess
     * @param {function} onFailure
     */
    self.OnUserRegistration = function (user, onSuccess, onFailure) {
        if (onSuccess) {
            onSuccess("OK");
        } else if (onFailure) {
            onFailure("NOK")
        }
    };
    /**
     * Application callback use to allow an independent data provider from this REST service to register a DEVICE.
     * This function MUST have a success callback AND a error callback.
     *
     * @param {object} user
     * @param {function} onSuccess
     * @param {function} onFailure
     */
    self.OnDeviceRegistration = function (user, onSuccess, onFailure) {
        if (onSuccess) {
            onSuccess("OK");
        } else if (onFailure) {
            onFailure("NOK")
        }
    };
    /**
     * Application callback use to allow an independent data provider from this REST service to register a MACHINE.
     * This function MUST have a success callback AND a error callback.
     *
     * @param {object} user
     * @param {function} onSuccess
     * @param {function} onFailure
     */
    self.OnMachineRegistration = function (user, onSuccess, onFailure) {
        if (onSuccess) {
            onSuccess("OK");
        } else if (onFailure) {
            onFailure("NOK")
        }
    };
    /**
     * Initialization of the REST services. This services contains :
     *  1) A registration method in order to save users, devices or client's machines.
     *  2) An authentication method in order to retrieve authorization a client to interact with the server.
     *  3) An add method will create a new registration process for devices or client's machine for the current login user.
     *
     * @param {number} port integer to determine the running port of the REST
     */
    self.InitServer = function (port) {
        if (isNaN(Number(port))) {
            port = 9898;
        }
        self._server = rest.createServer();
        self._server.use(rest.bodyParser());
        self._server.post("/reg", self._registration);
        self._server.post("/auth", self._authentication);
        self._server.post("/add", self._add);
        self._server.listen(port, function () {
            self.Log.i("REST Services started on port", port);
        });
        /**
         * Internal REST Service Method to protect from crawling services. This method will override the default behavior
         * of displaying the message <code>Method GET/POST not allowed</code>
         *
         * @param {object} req
         * @param {object} res
         * @private
         */
        self._unknownMethodHandler = function (req, res) {
            self.Log.e("REST unknownMethodHandler call", req.connection.remoteAddress, req.connection.remotePort);
            return res.send(404)
        };
        self._server.on('MethodNotAllowed', self._unknownMethodHandler);
    };

    /**
     * Internal method made to filtered or modify request before sending the request through the <code>RequestValidation</code> method.
     * @param req
     * @returns {boolean}
     * @private
     */
    self._isRequestAllow = function (req) {
        if (self.RequestValidation) {
            return self.RequestValidation(req);
        }
        return true;
    };
    /**
     * Application callback made to separate the validation (token or login or whatever) to allow a request to be processed.
     * This method MUST return TRUE or FALSE.
     *
     * @param request
     * @returns {boolean}
     */
    self.RequestValidation = function (request) {
        return (request ? true : false);
    };
    return self;
};