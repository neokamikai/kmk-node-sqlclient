import * as sql from 'mssql';
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
interface InsertStatement<T> {
    tableName: string;
    schemaName?: string;
    values: T | {
        [id: string]: SqlFieldValue<any>;
    };
}
interface UpdateStatement<T> {
    tableName: string;
    schemaName?: string;
    set: T | {
        [id: string]: SqlFieldValue<any>;
    };
    where?: T | {
        [id: string]: SqlFieldCompare<any>;
    };
}
interface DeleteStatement<T> {
    tableName: string;
    schemaName?: string;
    where?: T | {
        [id: string]: SqlFieldCompare<any>;
    };
}
interface DeleteStatementOptions {
    top?: number;
    topPercent?: number;
}
export declare type SqlTypeNames = 'VARCHAR' | 'INT' | 'BIGINT' | 'NVARCHAR' | 'FLOAT' | 'DECIMAL' | 'MONEY' | 'NUMERIC' | 'CHAR' | 'DATE' | 'DATETIME';
export declare type SqlFieldValue<T> = T | {
    'cast': {
        value: SqlFieldValue<T>;
        as: SqlTypeNames;
    };
} | {
    convert: {
        type: SqlTypeNames;
        value: SqlFieldValue<T>;
        flag?: number;
    };
};
export declare type SqlFieldCompare<T> = SqlFieldValue<T> | {
    and: Array<SqlFieldCompare<T>>;
} | {
    or: Array<SqlFieldCompare<T>>;
} | {
    'is': null;
} | {
    'is not': null;
} | {
    'in': Array<SqlFieldValue<T>>;
} | {
    'between': [SqlFieldValue<T>, SqlFieldValue<T>];
} | {
    'not between': [T, T];
} | {
    'not in': Array<T>;
} | {
    '>': SqlFieldValue<T>;
} | {
    '<': SqlFieldValue<T>;
} | {
    '>=': SqlFieldValue<T>;
} | {
    '<=': SqlFieldValue<T>;
} | {
    'like': SqlFieldValue<T>;
} | {
    'not like': SqlFieldValue<T>;
} | {
    '!=': SqlFieldValue<T>;
} | {
    '<>': SqlFieldValue<T>;
} | {
    '=': SqlFieldValue<T>;
};
export declare type SqlFieldComparisonFieldName = SqlFieldValue<string>;
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
     * name
     */
    queryInsert<T>(parameters: InsertStatement<T>): Promise<sql.IProcedureResult<unknown>>;
    /**
     * queryDelete
     */
    queryDelete<T>(parameters: DeleteStatement<T>, options?: DeleteStatementOptions): Promise<sql.IProcedureResult<unknown>>;
    /**
     * queryUpdate
     */
    queryUpdate<T>(parameters: UpdateStatement<T>): Promise<sql.IProcedureResult<unknown>>;
    /**
     * queryPreparedStatement
     */
    queryPreparedStatement<T>(sqlCommandStatement: any, parameters: {
        [id: string]: SqlFieldValue<any>;
    }): Promise<sql.IProcedureResult<T>>;
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
