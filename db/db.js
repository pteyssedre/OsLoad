/**
 * Created by pteyssedre on 15-02-23.
 * file create in order to manage DB creation and manipulation outside of the 'server code' file
 */
var cradle = require('cradle');
var bcrypt = require('bcrypt');

// <editor-fold desc="CouchDB Views">
var user_db_view = {
    version: 1,
    views: {
        byLogin: {
            map: function (doc) {
                if (doc["instance"] && doc.instance["login"]) {
                    emit(doc.instance.login, doc);
                }
            }
        },
        byUserEmail: {
            map: function (doc) {
                if (doc["instance"] && doc.instance["email"]) {
                    emit(doc.instance.email, doc);
                }
            }
        },
        pairLogin: {
            map: function (doc) {
                if (doc["instance"] && doc.instance["login"] && doc.instance["password"]) {
                    emit(doc.instance.login, doc.instance.password);
                }
            }
        },
        byRelation: {
            map: function (doc) {
                if (doc._id && doc._id.indexOf("link_") == 0) {
                    emit(doc._id, doc.instance.linked);
                }
            }
        },
        profileById: {
            map: function (doc) {
                if (doc._id && doc.instance) {
                    if (doc.type == "user") {
                        var _profile = {};
                        for (var name in doc.instance) {
                            if (name != "password") {
                                _profile[name] = doc.instance[name];
                            }
                        }
                        emit(doc._id, _profile);
                    }
                }
            }
        }
    }
};
var client_db_view = {
    version: 1,
    views: {
        byMachineId: {
            map: function (doc) {
                if (doc["instance"] && doc.instance["machineId"]) {
                    emit(doc.instance.machineId, doc);
                }
            }
        },
        byUserId: {
            map: function (doc) {
                if (doc["instance"] && doc.instance["userId"]) {
                    emit(doc.instance.userId, doc);
                }
            }
        }
    }
};
// </editor-fold>

var DbHelper = {
    /**
     * DataSource manager.
     * @constructor
     */
    DataSource: function () {
        var self = this;
        // <editor-fold desc="Logger">
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
        // </editor-fold>
        // <editor-fold desc="properties">
        self._cradle = cradle;
        self._defaultConnectionOptions = {
            cache: true,
            raw: false,
            forceSave: true
        };
        self._creationCallback = null;
        self._db = null;
        self._db_user = null;
        self._db_history = null;
        self._db_asset = null;
        self._db_stat = null;
        self._dbNames = [];
        self._bcrypt = bcrypt;
        // </editor-fold>
        /**
         * Helper to instantiate the Database connection.
         * @param {string} host IP or host name of the db server.
         * @param {int} port port number.
         * @param {Object} [options] Options to send with the {@link cradle} connection.
         * @constructor
         */
        self.InitDBConnection = function (host, port, options) {
            self._db = new (self._cradle.Connection)(host, port);
            return this;
        };
        /**
         * Helper to create, if they do not exist, and update them if needed.
         * @param {Function} callback Function which will be call when all databases have been created and up to date.
         */
        self.CreateAllDB = function (callback) {
            self._creationCallback = callback;
            if (self._db == null) {
                self._db = new (self._cradle.Connection)('127.0.0.1', 5984, {
                    cache: true,
                    raw: false,
                    forceSave: true
                });
            }
            self._db_user = self._db.database('osLoad_user');
            self._db_client = self._db.database('osLoad_client');
            self._db_stats = self._db.database('osLoad_stats');

            function initOrUpdateViews(database, views) {
                database.exists(function (err, exists) {
                    if (err) {
                        self.Log.e(database.name, 'an error occurred', err);
                    } else if (exists) {
                        self.Log.i(database.name, 'already exist');
                        database.get('_design/views', function (err, doc) {
                            if (err) {
                                self.Log.e("Error during validation of the views of", database.name);
                            } else {
                                if (doc.version < views.version) {
                                    self.Log.w(" !!!", database.name, "views version match ... update required !!! ");
                                    database.merge('_design/views', views, function (err, res) {
                                        if (err) {
                                            self.Log.e(database.name, 'an error occurred during update of views', err)
                                        } else {
                                            self.Log.i(database.name, 'views successfully updated');
                                            self._OnDBCreateSuccess("user");
                                        }
                                    });
                                } else {
                                    self.Log.i(database.name, "views version match ... no update required");
                                    self._OnDBCreateSuccess("user");
                                }
                            }
                        });
                    } else {
                        self.Log.i(database.name, 'does not exists.');
                        self.Log.i('Creating', database.name, '...');
                        database.create(function (err) {
                            if (err) {
                                self.Log.e(database.name, 'an error occurred during creation', err)
                            } else {
                                self.Log.i(database.name, 'successfully created');
                                /* populate design documents */
                                database.save('_design/views', views, function (err, res) {
                                    if (err) {
                                        self.Log.e(database.name, 'an error occurred during creation of views', err)
                                    } else {
                                        self.Log.i(database.name, 'views successfully created');
                                        self.Log.d(database.name, 'views successfully created', res);
                                        self._OnDBCreateSuccess("user");
                                    }
                                });
                            }
                        });
                    }
                });
            }

            initOrUpdateViews(self._db_user, user_db_view);
            initOrUpdateViews(self._db_client, client_db_view);
        };
        /**
         * Internal callback executed each time a database has been created and is up to date.
         * After all database have been created, the {@link #_creationCallback} will be executed.
         * @param name
         * @private
         */
        self._OnDBCreateSuccess = function (name) {
            self._dbNames.push(name);
            if (self._dbNames.length == 1 && self._creationCallback) {
                self._creationCallback();
            }
        };
        /**
         * Function use to create a new User in the User_db
         * @param {Object} user Object to save into the database. This object must contain the following properties
         *              login : string
         *              email : string
         *              password : string
         *              WARNING the password property will be encrypted by this function.
         * @param {Function} successCallback
         * @param {Function} failCallback
         */
        self.AddUser = function (user, successCallback, failCallback) {
            if (user && (user.name || (user.firstname || user.lastname) || user.login) && user.login && user.password && user.email) {
                user.name = user.name || (user.firstname || user.lastname) || user.login;

                user.password = self._bcrypt.hashSync(user.password);
                self._db_user.save({
                    instance: user,
                    created: new Date().getTime(),
                    type: "user",
                    lastUpdate: new Date().getTime()
                }, function (err, res) {
                    if (err) {
                        self.Log.e("AddUser: an error occurred during process", err);
                        if (failCallback) {
                            failCallback(err);
                        }
                    } else {
                        self.Log.d("AddUser: new user created.", res.id);
                        user.id = res.id;
                        user.rev = res.rev;
                        //To prevent password to been send back into the response.
                        user.instance ? delete user.instance.password : "";
                        if (successCallback) {
                            successCallback(user);
                        }
                    }
                });
            } else {
                self.Log.e("AddUser: Instance does not contain all the mandatory fields.");
                if (failCallback) {
                    failCallback("Instance does not contain all the mandatory fields.")
                }
            }
        };
        /**
         * Helper to validate if the given login parameter does not exist into the db.
         * @param {string} login login to validate.
         * @param {Function} callback Function to execute when process is done. This function will have one {@link boolean} parameter that indicate the availability of the login.
         */
        self.IsLoginAvailable = function (login, callback) {
            self.Log.d("Validation of", login);
            if (self._db_user != null && login && login.length > 0) {
                self._db_user.view('views/byLogin', {key: login}, function (err, doc) {
                    if (err) {
                        self.Log.e("IsLoginAvailable: an error occurred during process", err);
                        if (callback) {
                            callback(false, err);
                        }
                    } else {
                        self.Log.d("IsLoginAvailable:", (doc.length == 0));
                        if (callback) {
                            callback(doc.length == 0);
                        }
                    }
                });
            } else if (callback) {
                callback(false);
            }
        };
        /**
         * Helper to validate if the given email parameter does not exist into the db.
         * @param {string} email Email address to validate.
         * @param {Function} callback Function to execute when process is done. This function will have one {@link boolean} parameter that indicate the availability of the email.
         */
        self.IsEmailAvailable = function (email, callback) {
            self.Log.d("Validation of", email);
            if (self._db_user != null && email && email.length > 0) {
                self._db_user.view('views/byUserEmail', {key: email}, function (err, doc) {
                    if (err) {
                        self.Log.e("IsEmailAvailable: an error occurred during process", err);
                        if (callback) {
                            callback(err);
                        }
                    } else {
                        self.Log.d("IsEmailAvailable:", (doc.length == 0));
                        if (callback) {
                            callback(doc.length == 0);
                        }
                    }
                });
            } else if (callback) {
                callback(false);
            }
        };
        /**
         * Helper to authenticate a pair Login - Password through the user database.
         * @param {string} login Login value to test.
         * @param {string} password Password value, this value should not be encrypted.
         * @param {Function} callback Function call after the process. Two parameter will be sent 1st boolean, 2nd object. If valid the 2nd parameter will be the userId.
         */
        self.ValidateCredentials = function (login, password, callback) {
            self.Log.d("Validation of credentials for", login);
            if (self._db_user != null && login && login.length > 0) {
                self._db_user.view('views/pairLogin', {key: login}, function (err, doc) {
                    if (err) {
                        self.Log.e("ValidateCredentials: an error occurred during process", err);
                        if (callback) {
                            callback(false, err);
                        }
                    } else {
                        if (doc.length == 1) {
                            self.Log.d("Comparing password", self._bcrypt.compareSync(password, doc[0].value));
                            if (callback) {
                                callback(self._bcrypt.compareSync(password, doc[0].value), doc[0].id);
                            }
                        } else {
                            self.Log.w("Comparing password no result return");
                            if (callback) {
                                callback(false, null);
                            }
                        }
                    }
                });
            } else if (callback) {
                callback(false);
            }
        };
        /**
         * Retrieved an User base on the unique id.
         * @param {string} id
         * @param {Function} success
         * @param {Function} [fail]
         */
        self.GetUser = function (id, success, fail) {
            if (self._db_user && id && id.length > 0) {
                self._db_user.view("views/profileById", {key: id}, function (err, doc) {
                    if (err) {
                        self.Log.e("Error during fetching user", id, err);
                        return fail(err);
                    } else {
                        if (doc.length > 0) {
                            self.Log.d("GetUsers: get user id", id);
                            if (success) {
                                return success(doc[0].value)
                            }
                        } else {
                            self.Log.e("GetUser No profile found for id", id);
                            if (fail) {
                                return fail("not found");
                            }
                        }
                    }
                });
            }
        };
        /**
         * Retrieved an Array of Users given an Array of Ids
         * @param {Array} ids
         * @param {Function} success
         * @param {Function} [fail]
         */
        self.GetUsers = function (ids, success, fail) {
            if (self._db_user && ids && ids.length > 0) {
                self._db_user.view("views/profileById", {keys: ids}, function (err, doc) {
                    if (err) {
                        self.Log.e("Error during fetching users", ids, err);
                        return fail(err);
                    } else {
                        self.Log.d("GetUsers: get users id", doc);
                        var _resl = [];
                        for (var i = 0; i < doc.length; i++) {
                            _resl.push(doc[i].value);
                        }
                        if (_resl.length > 0) {
                            if (success) {
                                success(_resl);
                            }
                        }
                    }
                });
            }
        };
        /**
         * Adding Contacts to an User.
         * @param {string} userId
         * @param {string} targetId
         * @param {Function} callback
         */
        self.AddToContactOf = function (userId, targetId, callback) {
            if (self._db_user && userId && userId.length > 0 && targetId && targetId.length > 0) {
                var _link = {
                    instance: {
                        owner: userId,
                        linked: targetId,
                        status: 0
                    },
                    type: "link",
                    created: new Date().getTime(),
                    lastUpdate: new Date().getTime()
                }; //TODO: What else do we need ?
                self._db_user.save("link_" + userId + "_" + targetId, _link, function (err, doc) {
                    if (err) {
                        self.Log.e("Error during creation of link between", userId, "and", targetId, err);
                        if (callback) {
                            callback(false, err)
                        }
                    } else {
                        self.Log.d("New friend request created", doc.id);
                        if (callback) {
                            callback(true, doc);
                        }
                    }
                });
            } else {
                self.Log.d("AddToContactOf Not valid input");
                if (callback) {
                    callback(false, "Not valid input");
                }
            }
        };
        /**
         * Retrieved friends Id of a specific User.
         * @param {string} userId
         * @param {Function} callback
         */
        self.GetFriendsIdOf = function (userId, callback) {
            var _result = [];
            if (self._db_user && userId) {
                self._db_user.view("views/byRelation", {keystart: "link_" + userId}, function (err, resp) {
                    if (err) {
                        self.Log.e("Error during fetch of contacts of", userId);
                        if (callback) {
                            callback(false, err);
                        }
                    } else {
                        self.Log.d("GetFriendsIdOf: result of query", resp.length);
                        for (var i = 0; i < resp.length; i++) {
                            _result.push(resp[i].value)
                        }
                        if (callback) {
                            callback(true, _result);
                        }
                    }

                });
            } else if (callback) {
                callback(false, _result);
            }
        };
        /**
         * Validate is a register Contact of a specific User.
         * @param {string} userId
         * @param {string} targetId
         * @param {Function} callback
         */
        self.IsFriendsOf = function (userId, targetId, callback) {
            if (self._db_user && userId) {
                self._db_user.view("views/byRelation", {key: "link_" + userId + "_" + targetId}, function (err, resp) {
                    if (err) {
                        self.Log.e("Error during verifying link between", userId, "and", targetId);
                        if (callback) {
                            callback(false, err);
                        }
                    } else {
                        self.Log.d("IsFriendsOf: result of query", resp.length);
                        if (callback) {
                            callback(resp.length == 1, resp[0]);
                        }
                    }

                });
            } else if (callback) {
                callback(false, {});
            }
        };
        return self;
    }
};
module.exports = DbHelper;