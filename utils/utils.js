/**
 * Created by pteyssedre on 15-02-28.
 */
module.exports = {
    Base64: {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        _utf8_encode: function (c) {
            c = c.replace(/\r\n/g, "\n");
            var a = "";
            for (var d = 0; d < c.length; d++) {
                var b = c.charCodeAt(d);
                if (b < 128) {
                    a += String.fromCharCode(b)
                } else {
                    if (b > 127 && b < 2048) {
                        a += String.fromCharCode(b >> 6 | 192);
                        a += String.fromCharCode(b & 63 | 128)
                    } else {
                        a += String.fromCharCode(b >> 12 | 224);
                        a += String.fromCharCode(b >> 6 & 63 | 128);
                        a += String.fromCharCode(b & 63 | 128)
                    }
                }
            }
            return a
        },
        _utf8_decode: function (c) {
            var a = "";
            var d = 0;
            var b = c1 = c2 = 0;
            while (d < c.length) {
                b = c.charCodeAt(d);
                if (b < 128) {
                    a += String.fromCharCode(b);
                    d++
                } else {
                    if (b > 191 && b < 224) {
                        c2 = c.charCodeAt(d + 1);
                        a += String.fromCharCode((b & 31) << 6 | c2 & 63);
                        d += 2
                    } else {
                        c2 = c.charCodeAt(d + 1);
                        c3 = c.charCodeAt(d + 2);
                        a += String.fromCharCode((b & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                        d += 3
                    }
                }
            }
            return a
        },
        encode: function (j) {
            var m = "";
            var d, b, g, p, c, l, k;
            var h = 0;
            j = Base64._utf8_encode(j);
            while (h < j.length) {
                d = j.charCodeAt(h++);
                b = j.charCodeAt(h++);
                g = j.charCodeAt(h++);
                p = d >> 2;
                c = (d & 3) << 4 | b >> 4;
                l = (b & 15) << 2 | g >> 6;
                k = g & 63;
                if (isNaN(b)) {
                    l = k = 64
                } else {
                    if (isNaN(g)) {
                        k = 64
                    }
                }
                m = m + this._keyStr.charAt(p) + this._keyStr.charAt(c) + this._keyStr.charAt(l) + this._keyStr.charAt(k)
            }
            return m
        },
        decode: function (j) {
            var m = "";
            var d, b, g;
            var p, c, l, k;
            var h = 0;
            j = j.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (h < j.length) {
                p = this._keyStr.indexOf(j.charAt(h++));
                c = this._keyStr.indexOf(j.charAt(h++));
                l = this._keyStr.indexOf(j.charAt(h++));
                k = this._keyStr.indexOf(j.charAt(h++));
                d = p << 2 | c >> 4;
                b = (c & 15) << 4 | l >> 2;
                g = (l & 3) << 6 | k;
                m = m + String.fromCharCode(d);
                if (l != 64) {
                    m = m + String.fromCharCode(b)
                }
                if (k != 64) {
                    m = m + String.fromCharCode(g)
                }
            }
            m = Base64._utf8_decode(m);
            return m
        }
    },
    Date: {
        _current: new Date().getTime(),
        now: function(){
            this._current = new Date().getTime();
            return this;
        },
        add: function(t){
            var p = t.split(/:/);
            var s = (parseInt(p[0], 10) * 60 * 60 * 1000) +
                (parseInt(p[1], 10) * 60 * 1000) +
                (parseInt(p[2], 10) * 1000);

            var d = new Date();
            d.setTime(this.now()._current + s);
            return d;
        },
        diff: function (d, b) {
            var c = {};
            var a = (b?b - d:d - this.now()._current);
            a = Math.floor(a / 1000);
            c.sec = a % 60;
            a = Math.floor((a - c.sec) / 60);
            c.min = a % 60;
            a = Math.floor((a - c.min) / 60);
            c.hour = a % 24;
            a = Math.floor((a - c.hour) / 24);
            c.day = a;
            return c
        },
        past:function(d){
            return this.now()._current > d;
        }

    }
};