import * as sql from 'mssql';
/**
 * Sql Query Result -> this is the raw result returned from mssql.ConnectionPool.request.query
 */
interface IQueryResult<T> {
	recordset: Array<T>
	recordsets: Array<Array<any>>
	rowsAffected: Array<number>
}

interface SqlClientOptions {
	encrypt: boolean
}
interface InsertStatement<T> {
	tableName: string;
	schemaName?: string;
	values: T | { [id: string]: SqlFieldValue<any> };
}
interface UpdateStatement<T> {
	tableName: string,
	schemaName?: string,
	set: T | { [id: string]: SqlFieldValue<any> };
	where?: T | { [id: string]: SqlFieldCompare<any> };
}
interface DeleteStatement<T> {
	tableName: string,
	schemaName?: string,
	where?: T | { [id: string]: SqlFieldCompare<any> };
}
interface DeleteStatementOptions {
	top?: number
	topPercent?: number
}
interface UpdateSet {
	[id: string]: any
}
export type SqlTypeNames = 'VARCHAR' | 'INT' | 'BIGINT' | 'NVARCHAR' | 'FLOAT' | 'DECIMAL' | 'MONEY' | 'NUMERIC' | 'CHAR' | 'DATE' | 'DATETIME';

export type SqlFieldValue<T> = T | { 'cast': { value: SqlFieldValue<T>, as: SqlTypeNames } } | { convert: { type: SqlTypeNames, value: SqlFieldValue<T>, flag?: number } };
export type SqlFieldCompare<T> = SqlFieldValue<T> | { and: Array<SqlFieldCompare<T>> } | { or: Array<SqlFieldCompare<T>> } | { 'is': null } | { 'is not': null } | { 'in': Array<SqlFieldValue<T>> } | { 'between': [SqlFieldValue<T>, SqlFieldValue<T>] } | { 'not between': [T, T] } | { 'not in': Array<T> } | { '>': SqlFieldValue<T> } | { '<': SqlFieldValue<T> } | { '>=': SqlFieldValue<T> } | { '<=': SqlFieldValue<T> } | { 'like': SqlFieldValue<T> } | { 'not like': SqlFieldValue<T> } | { '!=': SqlFieldValue<T> } | { '<>': SqlFieldValue<T> } | { '=': SqlFieldValue<T> };
export type SqlFieldComparisonFieldName = SqlFieldValue<string>;
function parseSqlFieldValue<T>(fieldValue: SqlFieldValue<T>, finalValueCallback: Function, useRawValue: boolean = false) {
	if (typeof fieldValue === 'object' && fieldValue !== null) {
		if (!Array.isArray(fieldValue)) {
			const [op] = Object.keys(fieldValue);
			switch (`${op}`.toUpperCase()) {
				case 'CAST':
					const { value, as } = (fieldValue as any)[op];
					return `CAST(${parseSqlFieldValue(value, finalValueCallback, useRawValue)} AS ${as})`;
				case 'CONVERT': {
					const { type, value, flag } = (fieldValue as any)[op];
					return `CONVERT(${[type, parseSqlFieldValue(value, finalValueCallback, useRawValue), flag].filter(a => typeof a !== 'undefined')})`
				}
				default:
					break;
			}
		}
	}
	else if (useRawValue) return fieldValue
	else return finalValueCallback(fieldValue as any);
}
function generateSqlFieldComparison<T>(fieldName: SqlFieldComparisonFieldName, data: SqlFieldCompare<T>, callback?: Function) {
	callback = callback || ((v) => v);
	if (typeof data === 'undefined')
		return '';
	else if (data == null) {
		return `${parseSqlFieldValue(fieldName, callback, true)} IS ${parseSqlFieldValue(data as any, callback)}`;
	}
	else if (typeof data === 'object') {
		const [$operator] = Object.keys(data) as Array<('or' | 'and' | 'in' | 'not in' | 'between' | 'not between' | 'like' | 'not like' | '>' | '>=' | '<' | '<=' | '!=' | '<>' | '=')>;
		switch ($operator) {
			case 'and': case 'or': {
				return `(${(data[$operator] as Array<SqlFieldCompare<T>>).map(value => generateSqlFieldComparison(fieldName, value)).join(` ${$operator.toUpperCase()} `)})`;
			}
			case 'in':
			case 'not in':
				return `${parseSqlFieldValue(fieldName, callback, true)} ${$operator.toUpperCase()} (${(data[$operator] as Array<T>).map(e => parseSqlFieldValue(e as any, callback, false)).join(', ')})`
			case 'between':
			case 'not between':
				return `${parseSqlFieldValue(fieldName, callback, true)} ${$operator.toUpperCase()} ${parseSqlFieldValue(data[$operator][0], callback, false)} AND ${parseSqlFieldValue(data[$operator][1], callback)}`
			default:
				return `${parseSqlFieldValue(fieldName, callback, true)} ${$operator.toUpperCase()} ${parseSqlFieldValue(data[$operator] as any, callback, false)}`;
		}
	}
	else {
		return `${parseSqlFieldValue(fieldName, callback, true)} = ${parseSqlFieldValue(data as any, callback)}`;
	}
}
function getSqlType(value) {
	if (value === null || typeof value === "string" || typeof value === 'undefined') return sql.VarChar();
	if (Object.getPrototypeOf(value) === Date.prototype) return sql.DateTime();
	if (typeof value === 'number') return sql.Numeric;
	if (typeof value === 'bigint') return sql.BigInt;
	if (typeof value === 'boolean') return sql.Bit;
	if (typeof value === 'object' || typeof value === 'symbol' || typeof value === 'function') return sql.Variant;

}
export class SqlClientConfig {
	user: string
	password: string
	server: string
	database?: string
	options?: SqlClientOptions
}
var sqlClientCounter = 0;
/** Sql Client -> wrapper for easy handling*/
export class SqlClient {
	private config: SqlClientConfig = new SqlClientConfig();
	private lastCommandStatement: string = null;
	private lastQueryResult: IQueryResult<any>;
	private connection: sql.ConnectionPool & { _connected: boolean };
	private instanceIndex = ++sqlClientCounter;
	static open: (config: SqlClientConfig, callback: (err: any, client: SqlClient) => {}) => void;
	public setConfig(config: SqlClientConfig) {
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
	}
	private version: string;

	public getVersion() { return this.version; }
	/** Connects to a MS SQL Server */
	async connect() {
		//console.log('Trying to connect ...', config);
		if (this.connection && this.connection._connected)
			throw new Error("Already connected.");
		let that = this;
		var _pool = new sql.ConnectionPool(this.config as any);
		await _pool.connect().then(pool => {
			console.log(`Connected to database [${(pool as any).config.database}] on server [${(pool as any).config.server}:${(pool as any).config.port}]`);
			(that as any).connection = pool;
		}).catch(err => { console.log('connection failre =>', err); });
		this.version = await this.fetchColumn(`select @@VERSION 'version'`, 'version');
	}
	/**
	 * Executes a sql query and returns recordsets and rows affected
	 */
	public async query<T>(sqlCommandStatement: string, ...optionalParams: any[]): Promise<IQueryResult<T>> {
		try {
			if (!this.connection || !this.connection._connected) await this.connect();
			var db = this.connection;
			try {
				const request = db.request();
				const result = this.lastQueryResult = await request.query(sqlCommandStatement + optionalParams.join(''));
				return result;
			} catch (err) {
				err.sqlCommandStatement = sqlCommandStatement;
				err.sqlConnection = { database: (db as any).config.database, server: (db as any).config.server, port: (db as any).config.port, options: (db as any).config.options, stream: (db as any).config.stream, parseJSON: (db as any).config.parseJSON };
				throw err;
			}
		} catch (e) {
			throw e;
		}
	}
	/**
	 * name
	 */
	public queryInsert<T>(parameters: InsertStatement<T>) {
		let preparedParameters = {};
		const fields = [];
		const values = [];
		const table = (typeof parameters.schemaName === 'string' && parameters.schemaName ? `[${parameters.schemaName}].[${parameters.tableName}]` : `[${parameters.tableName}]`).replace(/^\[+/, '[').replace(/^\]+/, ']');
		for (let param in (parameters.values as any)) {
			let count = 0;
			fields.push(`[${param}]`.replace(/^\[+/, '[').replace(/^\]+/, ']'));
			values.push(parseSqlFieldValue(param, () => {
				const preparedParameter = `${param}_${++count}`;
				preparedParameters[preparedParameter] = parameters.values[param];
				return `@${preparedParameter}`;

			}, false));
		}
		return this.queryPreparedStatement(`INSERT INTO ${table} (${fields.join(', ')}) VALUES (${values.join(', ')});`, parameters.values);
	}
	/**
	 * queryDelete
	 */
	public queryDelete<T>(parameters: DeleteStatement<T>, options?: DeleteStatementOptions) {
		const where = [];
		const { top = 0, topPercent = 0 } = options || {};
		let preparedParameters = {};
		let limit = typeof top === 'number' && top > 0 ? ` TOP (${top})` : typeof topPercent === 'number' && topPercent > 0 ? ` TOP (${top}) PERCENT` : '';
		for (let param in (parameters.where as any)) {
			let count = 0;
			where.push(generateSqlFieldComparison(param, parameters.where[param], () => {
				const preparedParameter = `where_${param}_${++count}`;
				preparedParameters[preparedParameter] = parameters.where[param];
				return `@${preparedParameter}`;
			}));
		return this.queryPreparedStatement(`DELETE${limit} FROM ${typeof parameters.schemaName === 'string' ? '[' + parameters.schemaName + '].' : ''}[${parameters.tableName}] ${where.length === 0 ? '' : `WHERE (${where.join(') AND (')})`};`, preparedParameters);
	}
	/**
	 * queryUpdate
	 */
	public queryUpdate<T>(parameters: UpdateStatement<T>) {
		const set = [];
		const where = [];
		let preparedParameters = {};
		for (let param in (parameters.set as any)) {
			//set.push(`[${param}] = @set_${param}`);
			let count = 0;
			set.push(`[${param}] = ${parseSqlFieldValue(param, () => {
				const preparedParameter = `set_${param}_${++count}`;
				preparedParameters[preparedParameter] = parameters.where[param];
				return `@${preparedParameter}`;

			}, false)}`);
		}
		for (let param in (parameters.where as any)) {
			//where.push(`[${param}] = @where_${param}`);
			let count = 0;
			where.push(generateSqlFieldComparison(param, parameters.where[param], () => {
				const preparedParameter = `where_${param}_${++count}`;
				preparedParameters[preparedParameter] = parameters.where[param];
				return `@${preparedParameter}`;
			}));
		}

		//const whereClause = (parameters.where ?Object.keys(parameters.where).map(f => generateSqlFieldComparison(f, parameters.where[f])).join(' AND '):'')||'1=1';
		return this.queryPreparedStatement(`UPDATE ${typeof parameters.schemaName === 'string' ? '[' + parameters.schemaName + '].' : ''}[${parameters.tableName}] SET ${set.join(', ')} ${where.length === 0 ? '' : `WHERE (${where.join(') AND (')})`};`, preparedParameters);
	}

	/**
	 * queryPreparedStatement
	 */
	public queryPreparedStatement<T>(sqlCommandStatement, parameters: { [id: string]: SqlFieldValue<any> }) {
		return new Promise<sql.IProcedureResult<T>>((resolve, reject) => {
			try {
				const ps = new sql.PreparedStatement(this.connection);
				for (let paramName of parameters.values as any) {
					const sqlType = getSqlType((parameters.values as any)[paramName]);
					ps.input(paramName, sqlType);
				}
				ps.prepare(sqlCommandStatement, err => {
					// ... error checks
					if (err) return reject(err);
					ps.execute({ param: 12345 }, (err, result) => {
						// ... error checks
						if (err) {
							reject(err);
						}
						else resolve(result as any);
						// release the connection after queries are executed
						ps.unprepare(err => {
							// ... error checks
							if (err) return reject(err);

						})
					})
				})
			} catch (e) {
				reject(e);
			}
		})
	}
	/**
	 * Executes a query and returns the first rowSet for that query
	 * @param sqlCommandStatement
	 * @param optionalParams
	 */
	public async executeRowSet<T>(sqlCommandStatement: string, ...optionalParams: any[]): Promise<Array<T>> {
		var result = await this.query<T>(sqlCommandStatement);
		return result.recordset;
	};
	/**
	 * Executes a query and returns the last rowSet for that query
	 * @param sqlCommandStatement
	 * @param optionalParams
	 */
	public async executeLastRowSet<T>(sqlCommandStatement: string, ...optionalParams: any[]): Promise<Array<T>> {
		var result = await this.query<T>(sqlCommandStatement);
		return result.recordsets[result.recordsets.length - 1];
	};
	/**
	 * Executes a query and returns all rowSets for that query
	 * @param sqlCommandStatement
	 * @param optionalParams
	 */
	public async executeRowSets(sqlCommandStatement: string, ...optionalParams: any[]): Promise<Array<Array<any>>> {
		var result = await this.query(sqlCommandStatement, optionalParams);
		return result.recordsets;
	}
	/**
	 * Executes a query and returns the first row from the first rowSet for that query
	 * @param sqlCommandStatement
	 */
	public async fetchRow<T>(sqlCommandStatement: string): Promise<T> {
		var result = await this.query(sqlCommandStatement);
		var rowSet = result.recordsets[result.recordsets.length - 1];
		return (rowSet ? rowSet[0] : null) || null;
	}
	/**
	 * Executes a query and returns a specific field (index or name) from the first row from the first rowSet for that query
	 * @param sqlCommandStatement
	 * @param index string: field name
	 * number: field index
	 */
	public async fetchColumn(sqlCommandStatement: string, index: number | string = 0) {
		var result = await this.query(sqlCommandStatement);
		var rowSet = result.recordsets[result.recordsets.length - 1];
		if (!rowSet || !rowSet[0]) return null;
		if (typeof index === 'number')
			return Object.values(rowSet[0])[index];
		else if (typeof index === 'string') {
			var nIndex = Object.keys(rowSet[0]).findIndex(_ => _ === index);
			if (nIndex !== -1) return rowSet[0][index];
			return null;
		}

		return null;
	}
	/**
	 * Executes a sql statement and returns affected row count
	 * @param sqlCommandStatement
	 * @param optionalParams
	 */
	public async executeNonQuery(sqlCommandStatement: string, ...optionalParams: any[]): Promise<number> {
		var result = await this.query(sqlCommandStatement);
		var affected = 0;
		if (result) for (var a of result.rowsAffected) affected += a;
		return affected;
	}
	/** Returns the last sqlCommandStatement executed */
	public getLastsqlCommandStatement() {
		return this.lastCommandStatement;
	}
	constructor(config: SqlClientConfig = null) {
		if (config)
			this.setConfig(config);

	}
}
SqlClient.open = function (config: SqlClientConfig, callback: (err: any, client: SqlClient) => {}) {
	(async (): Promise<SqlClient> => {
		let client = new SqlClient(config);
		await client.connect();
		return client;
	})().then(client => { callback(null, client); }).catch(e => { callback(e, null); });
}
export default SqlClient;
