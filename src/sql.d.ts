/**
 * Sql Query Result -> this is the raw result returned from mssql.ConnectionPool.request.query
 */
interface IQueryResult<T> {
    recordset: Array<T>;
    recordsets: Array<Array<any>>;
    rowsAffected: Array<number>;
}
interface SqlClientOptions {
    encrypt: boolean;
}
export declare class SqlClientConfig {
    user: string;
    password: string;
    server: string;
    database?: string;
    options?: SqlClientOptions;
}
/** Sql Client -> wrapper for easy handling*/
export declare class SqlClient {
    private config;
    private lastCommandStatement;
    private lastQueryResult;
    private connection;
    private instanceIndex;
    static open: (config: SqlClientConfig, callback: (err: any, client: SqlClient) => {}) => void;
    setConfig(config: SqlClientConfig): void;
    private version;
    getVersion(): string;
    /** Connects to a MS SQL Server */
    connect(): Promise<void>;
    /**
     * Executes a sql query and returns recordsets and rows affected
     */
    query<T>(sqlCommandStatement: string, ...optionalParams: any[]): Promise<IQueryResult<T>>;
    /**
     * Executes a query and returns the first rowSet for that query
     * @param sqlCommandStatement
     * @param optionalParams
     */
    executeRowSet<T>(sqlCommandStatement: string, ...optionalParams: any[]): Promise<Array<T>>;
    /**
     * Executes a query and returns the last rowSet for that query
     * @param sqlCommandStatement
     * @param optionalParams
     */
    executeLastRowSet<T>(sqlCommandStatement: string, ...optionalParams: any[]): Promise<Array<T>>;
    /**
     * Executes a query and returns all rowSets for that query
     * @param sqlCommandStatement
     * @param optionalParams
     */
    executeRowSets(sqlCommandStatement: string, ...optionalParams: any[]): Promise<Array<Array<any>>>;
    /**
     * Executes a query and returns the first row from the first rowSet for that query
     * @param sqlCommandStatement
     */
    fetchRow<T>(sqlCommandStatement: string): Promise<T>;
    /**
     * Executes a query and returns a specific field (index or name) from the first row from the first rowSet for that query
     * @param sqlCommandStatement
     * @param index string: field name
     * number: field index
     */
    fetchColumn(sqlCommandStatement: string, index?: number | string): Promise<any>;
    /**
     * Executes a sql statement and returns affected row count
     * @param sqlCommandStatement
     * @param optionalParams
     */
    executeNonQuery(sqlCommandStatement: string, ...optionalParams: any[]): Promise<number>;
    /** Returns the last sqlCommandStatement executed */
    getLastsqlCommandStatement(): string;
    constructor(config?: SqlClientConfig);
}
export default SqlClient;
