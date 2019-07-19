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
	private connection: sql.ConnectionPool;
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
		var _pool = new sql.ConnectionPool(this.config);
		await _pool.connect().then(pool => {
			console.log(`Connected to database [${pool.config.database}] on server [${pool.config.server}:${pool.config.port}]`);
			that.connection = pool;
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
				err.sqlConnection = { database: db.config.database, server: db.config.server, port: db.config.port, options: db.config.options, stream: db.config.stream, parseJSON: db.config.parseJSON };
				throw err;
			}
		} catch (e) {
			throw e;
		}
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
SqlClient.open = function (config: SqlClientConfig, callback: (err: any, client: SqlClient) => { }) {
	(async (): Promise<SqlClient> => {
		let client = new SqlClient(config);
		await client.connect();
		return client;
	})().then(client => { callback(null, client); }).catch(e => { callback(e, null); });
}
export default SqlClient;
