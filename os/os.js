/**
 * Created by pteyssedre on 15-02-11.
 */

var _os = require("os"),
    _disk = require("diskspace"),
    colors = require('colors/safe');

var OsHelper ={
    Resources: function() {
        var self = this;
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
         * Helper function which given the current global usage for the CPUs during 1 second from now.
         * @param {function} onData callback use when the data is ready.
         * @param {int} [precision] number of precision digits.
         */
        self.getGlobalUsage = function (onData,precision) {
            var t1 = self.getGlobalAVG();
            setTimeout(function () {
                var t2 = self.getGlobalAVG();
                var idle = t2.idle - t1.idle;
                var total = t2.total - t1.total;
                var perc = idle / total;
                onData(Number(((1 - perc) * 100).toFixed(precision && !isNaN(Number(precision)) ? Number(precision) : 0 )));
            }, 1000);
        };
        /**
         * Helper function that given the current AVG.
         * @returns {{idle: number, total: number}}
         */
        self.getGlobalAVG = function () {
            var cpus = _os.cpus(), user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
            for (var cpu in cpus) {
                user += cpus[cpu].times.user;
                nice += cpus[cpu].times.nice;
                sys += cpus[cpu].times.sys;
                irq += cpus[cpu].times.irq;
                idle += cpus[cpu].times.idle;
            }
            var total = user + nice + sys + idle + irq;
            return {
                'idle': idle,
                'total': total
            };
        };
        /**
         * Helper function return the percentage usage peer CPU.
         * @param {function} onData callback use when the data is ready.
         * @param {int} [precision] number of precision digit.
         */
        self.UsageByCpu = function (onData, precision) {
            var t1 = self.LoadByCPU();
            setTimeout(function () {
                var units = [];
                var t2 = self.LoadByCPU();
                for (var i = 0; i < t1.length; i++) {
                    var idle = t2[i].use - t1[i].use;
                    var total = t2[i].total - t1[i].total;
                    var perc = idle / total;
                    units.push(Number((((perc) * 100)).toFixed(precision && !isNaN(Number(precision)) ? Number(precision) : 0 )));
                }
                onData(units);
            }, 1000);
        };
        /**
         * Helper function that give the current AVG for each CPU through an array.
         * @returns {Array}
         */
        self.LoadByCPU = function () {
            var units = [];
            var cpus = _os.cpus();
            for (var cpu in cpus) {
                units.push({
                    'idle': cpus[cpu].times.idle,
                    'use': cpus[cpu].times.user + cpus[cpu].times.nice + cpus[cpu].times.sys,
                    'total': cpus[cpu].times.user + cpus[cpu].times.nice + cpus[cpu].times.sys + cpus[cpu].times.irq + cpus[cpu].times.idle
                });
            }
            return units;
        };
        /**
         * Helper function to retrieved the disk space on the root drive.
         * @param {function} onData callback use when the data is ready.
         * @param {boolean} [human] flag to have value in human readable format.
         */
        self.getRootSpace = function (onData, human) {
            _disk.check('/', function (err, total, free, status) {
                if (err) {
                    self.Log.e(err);
                    return onData(err);
                }
                function _humanRead(num) {
                    var _r = Number(num);
                    if (!isNaN(_r) && human) {
                        var i = 0;
                        while (_r > 1024) {
                            _r = _r / 1024;
                            i++;
                        }
                        var labels = ["bytes", "Kbs", "Mbs", "Gbs", "Tbs", "Pbs"];
                        _r = Number(_r).toFixed(0) + " " + (i < labels.length ? labels[i] : "");
                    }
                    return _r;
                }

                return onData(null, _humanRead(total), _humanRead(free), _humanRead(total-free), status);
            });
        };
        /**
         *
         * @returns {{host: *, type: (*|String), platform: *, arch: *, release: *, uptime: *}}
         * @constructor
         */
        self.SystemInfo = function () {
            return {
                'host': _os.hostname(),
                'type': _os.type(),
                'platform': _os.platform(),
                'arch': _os.arch(),
                'release': _os.release(),
                'uptime': _os.uptime()
            };
        };
        return self;
    }
};
module.exports = OsHelper;