# kmk-mssqlclient

### Installation

`npm install kmk-mssqlclient`


### Usage

***Initialization***

```javascript
const SqlClient = require('kmk-mssqlclient');
const cn = new SqlClient();
cn.setConfig({
	user: 'username',
	password: 'password',
	server: 'server',
	database: 'database',
	options: {
		encrypt: false
	}
});
```
***Connecting***
```javascript
cn.connect()
.catch(e => {
	console.log(e);
})
.then(() => {
	console.log('connected');
})

/* OR */

SqlClient.open({
	user: 'username',
	password: 'password',
	server: 'server',
	database: 'database',
	options: {
		encrypt: false
	}
}, (err, client) => {
	if(err) console.log(err);
	else console.log(client);
})

```
***Connecting using async/await mode***
```javascript
(async () => {
	try{
		await cn.connect();
		console.log('connected');
	}
	catch(e){
		console.log(e);
	}
})()
```

***Querying data***
```javascript
cn.query('select * from table')
.catch(e => {
	console.log(e);
})
.then(result => {
	console.log(result);
})
```

***Querying data using async/await mode***
```javascript
(async () => {
	try{
		let result = await cn.query('select * from table');
		console.log(result);
	}
	catch(e){
		console.log(e);
	}
})()
```


### Methods
<table class="table">
	<thead>
		<tr>
			<th>Method Name</th>
			<th>Returns</th>
			<th>Parameters</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>connect</td>
			<td>Promise&lt;void&lt;T&gt;&gt;</td>
			<td>(void)</td>
			<td>Connects to a MS SQL Server</td>
		</tr>
		<tr>
			<td>query&lt;T&gt;</td>
			<td>Promise&lt;IQueryResult&lt;T&gt;&gt;</td>
			<td>(sqlCommandStatement: string, ...optionalParams: any[])</td>
			<td>Executes a sql query and returns recordsets and rows affected</td>
		</tr>
		<tr>
			<td>executeRowSet&lt;T&gt;</td>
			<td>Promise&lt;Array&lt;T&gt;&gt;</td>
			<td>(sqlCommandStatement: string, ...optionalParams: any[])</td>
			<td>Executes a query and returns the first rowSet for that query</td>
		</tr>
		<tr>
			<td>executeLastRowSet&lt;T&gt;</td>
			<td>Promise&lt;Array&lt;T&gt;&gt;</td>
			<td>(sqlCommandStatement: string, ...optionalParams: any[])</td>
			<td>Executes a query and returns the last rowSet for that query</td>
		</tr>
		<tr>
			<td>executeRowSets</td>
			<td>Promise&lt;Array<Array<any>>&gt;</td>
			<td>(sqlCommandStatement: string, ...optionalParams: any[])</td>
			<td>Executes a query and returns all rowSets for that query</td>
		</tr>
		<tr>
			<td>fetchRow&lt;T&gt;</td>
			<td>Promise&lt;T&gt;</td>
			<td>(sqlCommandStatement: string)</td>
			<td>Executes a query and returns the first row from the first rowSet for that query</td>
		</tr>
		<tr>
			<td>fetchColumn</td>
			<td></td>
			<td>(sqlCommandStatement: string, index: number | string = 0)</td>
			<td>Executes a query and returns a specific field (index or name) from the first row from the first rowSet for that query</td>
		</tr>
		<tr>
			<td>executeNonQuery</td>
			<td>Promise&lt;number&gt;</td>
			<td>(sqlCommandStatement: string, ...optionalParams: any[])</td>
			<td>Executes a sql statement and returns affected row count</td>
		</tr>
		<tr>
			<td>getLastsqlCommandStatement</td>
			<td>string</td>
			<td>(void)</td>
			<td>Returns the last sqlCommandStatement executed</td>
		</tr>
	</tbody>
</table>
