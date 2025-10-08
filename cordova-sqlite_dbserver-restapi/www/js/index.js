let myDB;

document.addEventListener('deviceready', async () => {

	myDB = window.sqlitePlugin.openDatabase({ name: "example.db", location: 'default' });

	myDB.transaction(function(tx) {
		tx.executeSql(
			'CREATE TABLE IF NOT EXISTS cordova_test (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, data REAL)',
			[],
			() => console.log("Table OK"),
			(tx, err) => console.error("CREATE error", err)
		);
	});

	myDB.transaction(function(tx) {
		tx.executeSql(
			'INSERT INTO cordova_test (title, data) VALUES (?, ?)',
			["First value", 42.0],
			() => console.log("Seed INSERT OK"),
			(tx, err) => console.warn("Seed INSERT error (probably already inserted)", err)
		);
	});

	webserver.onRequest(handleRequest);
	webserver.start(() => {
		console.log("Local server started on 8080");
	}, (e) => console.error("server start error", e));

});

function handleRequest(req) {
	const { method, path, body } = req;

	try {
		// GET /api/test  -> tömb [{id, title, data}, ...]
		if (method === "GET" && path === "/api/test") {
			return myDB.transaction(function(tx) {
				tx.executeSql(
					"SELECT id, title, data FROM cordova_test ORDER BY id DESC",
					[],
					(tx, result) => {
						const rows = [];
						for (let i = 0; i < result.rows.length; i++) {
							rows.push(result.rows.item(i));
						}
						return sendJSON(req, 200, rows);
					},
					(tx, err) => sendJSON(req, 500, { error: "DB select error", detail: String(err) })
				);
			});
   		}

		// POST /api/test  -> { id: newId }
		if (method === "POST" && path === "/api/test") {
			let { title = "", data = null } = JSON.parse(body);

			return myDB.transaction(function(tx) {
				tx.executeSql(
					"INSERT INTO cordova_test(title, data) VALUES (?, ?)",
					[title, data],
					(tx, result) => sendJSON(req, 201, { id: result.insertId }),
					(tx, err) => sendJSON(req, 500, { error: "Insert failed", detail: String(err) })
				);
			});
		}

		// PUT(POST) /api/test/:id  -> { id }
		if (method === "POST" && path.startsWith("/api/test/")) {
			let what = Number(path.split("/").pop());
			const { title = "", data = null } = JSON.parse(body);

			return myDB.transaction(function(tx) {
				tx.executeSql(
					"INSERT OR REPLACE INTO cordova_test(id, title, data) VALUES (?, ?, ?)",
					[what, title, data],
					(tx, result) => sendJSON(req, 200, { id: what }),
					(tx, err) => sendJSON(req, 500, { error: "Update failed", detail: String(err) })
				);
			});
		}

		// DELETE /api/test/:id  -> { id }
		if (method === "DELETE" && path.startsWith("/api/test/")) {
			let what = Number(path.split("/").pop());

			return myDB.transaction(function(tx) {
				tx.executeSql(
					"DELETE FROM cordova_test WHERE id=?",
					[what],
					(tx, result) => sendJSON(req, 200, { id: what }),
					(tx, err) => sendJSON(req, 500, { error: "Delete failed", detail: String(err) })
				);
			});
		}

		// fallback
		return sendJSON(req, 404, { error: "Not found", path, method });

	} catch (e) {
		console.error("route error", e);
		return sendJSON(req, 500, { error: "Internal", detail: String(e) });
	}
}

function sendJSON(req, status, obj) {
	webserver.sendResponse(
		req.requestId,
		{
			status,
			body: obj == null ? "" : JSON.stringify(obj),
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
				"Access-Control-Allow-Headers": "Content-Type"
			}
		},
		() => {},
		(e) => console.error("sendResponse error", e)
	);
}
