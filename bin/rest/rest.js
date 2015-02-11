/**
 * Created by pteyssedre on 2/10/2015.
 */
var rest = require("restify");
var util = require('util');

module.exports = function restServer(){
    var self = this;
    self._logger = undefined;
    self._server = undefined;
    self.Log = {
        _level:9,
        i:function(){
            if(this._level <= 4){
                console.log(arguments);
            }
        },
        d:function(){
            if(this._level <= 3){
                console.log(arguments);
            }
        },
        v:function(){
            if(this._level <= 2){
                console.log(arguments);
            }
        },
        w:function(){
            if(this._level <= 1){
                console.log(arguments);
            }
        },
        e:function(){
            if(this._level <= 0){
                console.log(arguments);
            }
        }
    };
    self._add = function(req, resp, next){

    };
    self.InitServer = function(port){
        if(isNaN(Number(port))){
            port = 9898;
        }
        self._server = rest.createServer();
        self._server.use(rest.bodyParser());
        self._server.post("/add", self._add);
        self._server.listen(port, function () {
            self.Log.i("REST Services started on port", port);
        });
    };

    function MyError(message) {
        rest.RestError.call(this, {
            restCode: 'MyError',
            statusCode: 405,
            message: message,
            constructorOpt: MyError
        });
        this.name = 'MyError';
    };
    util.inherits(MyError, rest.RestError);

    return self;
};