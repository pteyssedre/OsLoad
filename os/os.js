/**
 * Created by pteyssedre on 15-02-11.
 */

var _os = require("os"),
    colors = require('colors/safe');

module.exports = function() {
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
    self.getGlobalUsage = function (onData) {
        var t1 = self.getGlobalAVG();
        setTimeout(function () {
            var t2 = self.getGlobalAVG();
            var idle = t2.idle - t1.idle;
            var total = t2.total - t1.total;
            var perc = idle / total;
            onData(Number(((1 - perc) * 100).toFixed(2)));
        }, 1000);
    };
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
    self.UsageByCpu = function (onData) {
        var t1 = self.LoadByCPU();
        setTimeout(function () {
            var units = [];
            var t2 = self.LoadByCPU();
            for (var i = 0; i < t1.length; i++) {
                var idle = t2[i].use - t1[i].use;
                var total = t2[i].total - t1[i].total;
                var perc = idle / total;
                units.push(Number((((perc) * 100)).toFixed(2)));
            }
            onData(units);
        }, 1000);
    };
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
    self.SystemInfo = function(){
        return {
            'host':_os.hostname(),
            'type':_os.type(),
            'platform':_os.platform(),
            'arch':_os.arch(),
            'release':_os.release(),
            'uptime':_os.uptime()
        };
    };
    return self;
};