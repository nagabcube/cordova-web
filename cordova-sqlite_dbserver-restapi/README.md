## Android WebServer - SQLite Rest-API

This is a small Cordova Android app that runs a local HTTP REST API inside the mobile app using the `cordova-plugin-webserver` (NanoHTTPD) and stores data with `cordova-sqlite-storage`.
The webserver plugin is referenced from a GitHub repo (`bykof/cordova-plugin-webserver`)

What to change when adding routes or DB schema
- Add SQL schema changes inside the `deviceready` initialization in `www/js/index.js` so they run once on startup.
- New routes: append to `handleRequest` and follow the existing pattern: parse `req.method`/`req.path`, use `myDB.transaction(...)`, and return via `sendJSON`.
- Keep responses JSON and set `Content-Type: application/json` (the helpers already do this).

When unsure, inspect these example lines in `www/js/index.js`:
- GET list: `if (method === "GET" && path === "/api/test")` (selects all rows)
- INSERT: `INSERT INTO cordova_test(title, data) VALUES(?,?) RETURNING id` (used on POST)
- PUT workaround: `if (method === "POST" && path.startsWith("/api/test/"))` and `INSERT OR REPLACE INTO cordova_test(id, title, data) VALUES (?, ?, ?)`

### Developer workflows (how to build & run locally)

Note: these are standard Cordova workflows — the project doesn't include extra npm scripts.

Commands:
```
npm install -g cordova
npm install
cordova platform add android
cordova prepare
cordova build android
cordova run android --device
```

Additional notes:
- `cordova prepare` will install plugins listed in `config.xml`/`package.json`.
- Use `adb logcat` to view runtime logs on Android (look for console output from `index.js`):
```
adb logcat *:S chromium:V CordovaLog:V
```
- Use similar apps on Android like `Postman` to test GET/POST/DELETE requests (ApiClient)
