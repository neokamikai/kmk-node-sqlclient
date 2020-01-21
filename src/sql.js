"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var sql = __importStar(require("mssql"));
function parseSqlFieldValue(fieldValue, finalValueCallback, useRawValue) {
    if (useRawValue === void 0) { useRawValue = false; }
    if (typeof fieldValue === 'object' && fieldValue !== null) {
        if (!Array.isArray(fieldValue)) {
            var op = Object.keys(fieldValue)[0];
            switch (("" + op).toUpperCase()) {
                case 'CAST':
                    var _a = fieldValue[op], value = _a.value, as = _a.as;
                    return "CAST(" + parseSqlFieldValue(value, finalValueCallback, useRawValue) + " AS " + as + ")";
                case 'CONVERT': {
                    var _b = fieldValue[op], type = _b.type, value_1 = _b.value, flag = _b.flag;
                    return "CONVERT(" + [type, parseSqlFieldValue(value_1, finalValueCallback, useRawValue), flag].filter(function (a) { return typeof a !== 'undefined'; }) + ")";
                }
                default:
                    break;
            }
        }
    }
    else if (useRawValue)
        return fieldValue;
    else
        return finalValueCallback(fieldValue);
}
function generateSqlFieldComparison(fieldName, data, callback) {
    callback = callback || (function (v) { return v; });
    if (typeof data === 'undefined')
        return '';
    else if (data == null) {
        return parseSqlFieldValue(fieldName, callback, true) + " IS " + parseSqlFieldValue(data, callback);
    }
    else if (typeof data === 'object') {
        var $operator = Object.keys(data)[0];
        switch ($operator) {
            case 'and':
            case 'or': {
                return "(" + data[$operator].map(function (value) { return generateSqlFieldComparison(fieldName, value); }).join(" " + $operator.toUpperCase() + " ") + ")";
            }
            case 'in':
            case 'not in':
                return parseSqlFieldValue(fieldName, callback, true) + " " + $operator.toUpperCase() + " (" + data[$operator].map(function (e) { return parseSqlFieldValue(e, callback, false); }).join(', ') + ")";
            case 'between':
            case 'not between':
                return parseSqlFieldValue(fieldName, callback, true) + " " + $operator.toUpperCase() + " " + parseSqlFieldValue(data[$operator][0], callback, false) + " AND " + parseSqlFieldValue(data[$operator][1], callback);
            default:
                return parseSqlFieldValue(fieldName, callback, true) + " " + $operator.toUpperCase() + " " + parseSqlFieldValue(data[$operator], callback, false);
        }
    }
    else {
        return parseSqlFieldValue(fieldName, callback, true) + " = " + parseSqlFieldValue(data, callback);
    }
}
function getSqlType(value) {
    if (value === null || typeof value === "string" || typeof value === 'undefined')
        return sql.VarChar();
    if (Object.getPrototypeOf(value) === Date.prototype)
        return sql.DateTime();
    if (typeof value === 'number')
        return sql.Numeric;
    if (typeof value === 'bigint')
        return sql.BigInt;
    if (typeof value === 'boolean')
        return sql.Bit;
    if (typeof value === 'object' || typeof value === 'symbol' || typeof value === 'function')
        return sql.Variant;
}
var SqlClientConfig = /** @class */ (function () {
    function SqlClientConfig() {
    }
    return SqlClientConfig;
}());
exports.SqlClientConfig = SqlClientConfig;
var sqlClientCounter = 0;
/** Sql Client -> wrapper for easy handling*/
var SqlClient = /** @class */ (function () {
    function SqlClient(config) {
        if (config === void 0) { config = null; }
        this.config = new SqlClientConfig();
        this.lastCommandStatement = null;
        this.instanceIndex = ++sqlClientCounter;
        if (config)
            this.setConfig(config);
    }
    SqlClient.open = function (config, callback) {
        return new Promise(function (resolve, reject) {
            var client = new SqlClient(config);
            client.connect().then(function () {
                if (typeof callback === 'function') {
                    callback(null, client);
                    return resolve(client);
                }
                resolve(client);
            }).catch(function (e) {
                if (typeof callback === 'function') {
                    callback(e, null);
                    return;
                }
                reject(e);
            });
        });
    };
    SqlClient.prototype.setConfig = function (config) {
        this.config.user = config.user;
        this.config.password = config.password;
        this.config.database = config.database;
        this.config.server = config.server;
        delete this.config.options;
        if (typeof config.options === 'object' && !Array.isArray(config.options)) {
            this.config.options = { encrypt: false };
            if (config.options.hasOwnProperty('encrypt'))
                this.config.options.encrypt = !!config.options.encrypt;
        }
    };
    SqlClient.prototype.getVersion = function () { return this.version; };
    /** Connects to a MS SQL Server */
    SqlClient.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.connection && _this.connection._connected)
                return reject(new Error("Already connected."));
            var that = _this;
            var _pool = new sql.ConnectionPool(_this.config);
            _pool.connect().then(function (pool) {
                console.log("Connected to database [" + pool.config.database + "] on server [" + pool.config.server + ":" + pool.config.port + "]");
                that.connection = pool;
                _this.fetchColumn("select @@VERSION 'version'", 'version').then(function (value) {
                    _this.version = value;
                    resolve();
                }).catch(function (err) { reject(err); });
            }).catch(function (err) { reject(err); });
        });
    };
    /**
     * Executes a sql query and returns recordsets and rows affected
     */
    SqlClient.prototype.query = function (sqlCommandStatement) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var db, request, result, _a, err_1, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        if (!(!this.connection || !this.connection._connected)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        db = this.connection;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        request = db.request();
                        _a = this;
                        return [4 /*yield*/, request.query(sqlCommandStatement + optionalParams.join(''))];
                    case 4:
                        result = _a.lastQueryResult = _b.sent();
                        return [2 /*return*/, result];
                    case 5:
                        err_1 = _b.sent();
                        err_1.sqlCommandStatement = sqlCommandStatement;
                        err_1.sqlConnection = { database: db.config.database, server: db.config.server, port: db.config.port, options: db.config.options, stream: db.config.stream, parseJSON: db.config.parseJSON };
                        throw err_1;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _b.sent();
                        throw e_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * name
     */
    SqlClient.prototype.queryInsert = function (parameters) {
        var preparedParameters = {};
        var fields = [];
        var values = [];
        var table = (typeof parameters.schemaName === 'string' && parameters.schemaName ? "[" + parameters.schemaName + "].[" + parameters.tableName + "]" : "[" + parameters.tableName + "]").replace(/^\[+/, '[').replace(/^\]+/, ']');
        var _loop_1 = function (param) {
            var count = 0;
            fields.push(("[" + param + "]").replace(/^\[+/, '[').replace(/^\]+/, ']'));
            values.push(parseSqlFieldValue(param, function () {
                var preparedParameter = param + "_" + ++count;
                preparedParameters[preparedParameter] = parameters.values[param];
                return "@" + preparedParameter;
            }, false));
        };
        for (var param in parameters.values) {
            _loop_1(param);
        }
        return this.queryPreparedStatement("INSERT INTO " + table + " (" + fields.join(', ') + ") VALUES (" + values.join(', ') + ");", parameters.values);
    };
    /**
     * queryDelete
     */
    SqlClient.prototype.queryDelete = function (parameters, options) {
        var where = [];
        var _a = options || {}, _b = _a.top, top = _b === void 0 ? 0 : _b, _c = _a.topPercent, topPercent = _c === void 0 ? 0 : _c;
        var preparedParameters = {};
        var limit = typeof top === 'number' && top > 0 ? " TOP (" + top + ")" : typeof topPercent === 'number' && topPercent > 0 ? " TOP (" + top + ") PERCENT" : '';
        var _loop_2 = function (param) {
            var count = 0;
            where.push(generateSqlFieldComparison(param, parameters.where[param], function () {
                var preparedParameter = "where_" + param + "_" + ++count;
                preparedParameters[preparedParameter] = parameters.where[param];
                return "@" + preparedParameter;
            }));
        };
        for (var param in parameters.where) {
            _loop_2(param);
        }
        return this.queryPreparedStatement("DELETE" + limit + " FROM " + (typeof parameters.schemaName === 'string' ? '[' + parameters.schemaName + '].' : '') + "[" + parameters.tableName + "] " + (where.length === 0 ? '' : "WHERE (" + where.join(') AND (') + ")") + ";", preparedParameters);
    };
    /**
     * queryUpdate
     */
    SqlClient.prototype.queryUpdate = function (parameters) {
        var set = [];
        var where = [];
        var preparedParameters = {};
        var _loop_3 = function (param) {
            //set.push(`[${param}] = @set_${param}`);
            var count = 0;
            set.push("[" + param + "] = " + parseSqlFieldValue(param, function () {
                var preparedParameter = "set_" + param + "_" + ++count;
                preparedParameters[preparedParameter] = parameters.where[param];
                return "@" + preparedParameter;
            }, false));
        };
        for (var param in parameters.set) {
            _loop_3(param);
        }
        var _loop_4 = function (param) {
            //where.push(`[${param}] = @where_${param}`);
            var count = 0;
            where.push(generateSqlFieldComparison(param, parameters.where[param], function () {
                var preparedParameter = "where_" + param + "_" + ++count;
                preparedParameters[preparedParameter] = parameters.where[param];
                return "@" + preparedParameter;
            }));
        };
        for (var param in parameters.where) {
            _loop_4(param);
        }
        //const whereClause = (parameters.where ?Object.keys(parameters.where).map(f => generateSqlFieldComparison(f, parameters.where[f])).join(' AND '):'')||'1=1';
        return this.queryPreparedStatement("UPDATE " + (typeof parameters.schemaName === 'string' ? '[' + parameters.schemaName + '].' : '') + "[" + parameters.tableName + "] SET " + set.join(', ') + " " + (where.length === 0 ? '' : "WHERE (" + where.join(') AND (') + ")") + ";", preparedParameters);
    };
    /**
     * queryPreparedStatement
     */
    SqlClient.prototype.queryPreparedStatement = function (sqlCommandStatement, parameters) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var ps_1 = new sql.PreparedStatement(_this.connection);
                for (var _i = 0, _a = parameters; _i < _a.length; _i++) {
                    var paramName = _a[_i];
                    var sqlType = getSqlType(parameters[paramName]);
                    ps_1.input(paramName, sqlType);
                }
                ps_1.prepare(sqlCommandStatement, function (err) {
                    // ... error checks
                    if (err)
                        return reject(err);
                    ps_1.execute({ param: 12345 }, function (err, result) {
                        // ... error checks
                        if (err) {
                            reject(err);
                        }
                        else
                            resolve(result);
                        // release the connection after queries are executed
                        ps_1.unprepare(function (err) {
                            // ... error checks
                            if (err)
                                return reject(err);
                        });
                    });
                });
            }
            catch (e) {
                reject(e);
            }
        });
    };
    /**
     * Executes a query and returns the first rowSet for that query
     * @param sqlCommandStatement
     * @param optionalParams
     */
    SqlClient.prototype.executeRowSet = function (sqlCommandStatement) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query(sqlCommandStatement)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset];
                }
            });
        });
    };
    ;
    /**
     * Executes a query and returns the last rowSet for that query
     * @param sqlCommandStatement
     * @param optionalParams
     */
    SqlClient.prototype.executeLastRowSet = function (sqlCommandStatement) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query(sqlCommandStatement)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordsets[result.recordsets.length - 1]];
                }
            });
        });
    };
    ;
    /**
     * Executes a query and returns all rowSets for that query
     * @param sqlCommandStatement
     * @param optionalParams
     */
    SqlClient.prototype.executeRowSets = function (sqlCommandStatement) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query(sqlCommandStatement, optionalParams)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordsets];
                }
            });
        });
    };
    /**
     * Executes a query and returns the first row from the first rowSet for that query
     * @param sqlCommandStatement
     */
    SqlClient.prototype.fetchRow = function (sqlCommandStatement) {
        return __awaiter(this, void 0, void 0, function () {
            var result, rowSet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query(sqlCommandStatement)];
                    case 1:
                        result = _a.sent();
                        rowSet = result.recordsets[result.recordsets.length - 1];
                        return [2 /*return*/, (rowSet ? rowSet[0] : null) || null];
                }
            });
        });
    };
    /**
     * Executes a query and returns a specific field (index or name) from the first row from the first rowSet for that query
     * @param sqlCommandStatement
     * @param index string: field name
     * number: field index
     */
    SqlClient.prototype.fetchColumn = function (sqlCommandStatement, index) {
        if (index === void 0) { index = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var result, rowSet, nIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query(sqlCommandStatement)];
                    case 1:
                        result = _a.sent();
                        rowSet = result.recordsets[result.recordsets.length - 1];
                        if (!rowSet || !rowSet[0])
                            return [2 /*return*/, null];
                        if (typeof index === 'number')
                            return [2 /*return*/, Object.values(rowSet[0])[index]];
                        else if (typeof index === 'string') {
                            nIndex = Object.keys(rowSet[0]).findIndex(function (_) { return _ === index; });
                            if (nIndex !== -1)
                                return [2 /*return*/, rowSet[0][index]];
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Executes a sql statement and returns affected row count
     * @param sqlCommandStatement
     * @param optionalParams
     */
    SqlClient.prototype.executeNonQuery = function (sqlCommandStatement) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var result, affected, _a, _b, a;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.query(sqlCommandStatement)];
                    case 1:
                        result = _c.sent();
                        affected = 0;
                        if (result)
                            for (_a = 0, _b = result.rowsAffected; _a < _b.length; _a++) {
                                a = _b[_a];
                                affected += a;
                            }
                        return [2 /*return*/, affected];
                }
            });
        });
    };
    /** Returns the last sqlCommandStatement executed */
    SqlClient.prototype.getLastsqlCommandStatement = function () {
        return this.lastCommandStatement;
    };
    return SqlClient;
}());
exports.SqlClient = SqlClient;
/*SqlClient.open = function (config: SqlClientConfig, callback: (err: any, client: SqlClient) => {}) {
    return (async (): Promise<SqlClient> => {
        let client = new SqlClient(config);
        await client.connect();
        return client;
    })().then(client => { callback(null, client); }).catch(e => { callback(e, null); });
}*/
exports.default = SqlClient;
//# sourceMappingURL=sql.js.map