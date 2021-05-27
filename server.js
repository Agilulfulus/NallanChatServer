var url = require("./secret-url.js").url;

var express = require("express");
var app = express();
var MongoClient = require("mongodb").MongoClient;

function getMessages(db, channel, count, callback) {
	db.collection(channel)
		.find({})
		.sort({ _id: -1 })
		.limit(count)
		.toArray((err, res) => {
			if (err) throw err;
			callback(res);
		});
}

function getFile(db, channel, id, callback) {
	let e = db.collection(channel).find({ _id: id })[0];
	callback(JSON.parse(decodeURIComponent(e.content)).data);
}

function sendMessage(db, user, channel, content, callback) {
	var message = {
		user: user,
		content: content,
		timestamp: Date.now()
	};
	if (content.length == 0) if (callback) callback(message);
	db.collection(channel).insertOne(message, err => {
		if (err) throw err;
		if (callback) callback(message);
	});
}

function addUser(db, user, callback) {
	let collection = db.collection("users");
	collection.find({ user: user.user }).toArray((err, res) => {
		if (err) throw err;
		if (res.length == 0) {
			collection.insertOne({ user: user.user, password: user.password });
			if (callback) callback(res);
		} else {
			if (callback) callback();
		}
	});
}

function userExists(db, user, callback) {
	db.collection("users")
		.find({ user: user.user })
		.toArray((err, res) => {
			if (err) throw err;
			if (res.length > 0) {
				if (res[0].password == user.password) {
					callback(0);
				} else {
					callback(1);
				}
			} else {
				callback(2);
			}
		});
}

function login(dbmain, username, password, color, callback) {
	userExists(dbmain, { user: username, password: password }, res => {
		if (!(/^#[0-9A-F]{6}$/i.test(color))) {
			color = "#ffffff"
		}
		switch (res) {
			case 0: {
				console.log(username + " logged in.");
				callback({
					user: username,
					color: color
				});
				break;
			}
			case 1: {
				console.log("Incorrect password for user " + username);
				callback({ user: "NULL", color: color });
				break;
			}
			case 2: {
				console.log("New user " + username);
				addUser(dbmain, { user: username, password: password }, res => {
					callback({ user: username, color: color });
				});
				break;
			}
		}
	});
}

MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
	if (err) throw err;

	var dbchat = db.db("chat");
	var dbmain = db.db("main");

	app.get("/", function (req, res) {
		res.send(`
			<body>
				<p>
					Go to <a href="https://www.npmjs.com/package/nallanchat">nallanchat</a> for information; there exists no webclient as of now.
				</p>
			</body>
		`);
	});

	app.get("/read", function (req, res) {
		getMessages(
			dbchat,
			req.headers.channel,
			parseInt(req.headers.count),
			history => {
				res.send(history);
			}
		);
	});

	app.get("/file", function (req, res) {
		getFile(
			dbchat,
			req.query.channel,
			req.query.id,
			value => {
				res.send(value);
			}
		);
	});

	app.get("/send", function (req, res) {
		console.log(req.headers);
		login(
			dbmain,
			req.headers.user,
			req.headers.password,
			req.headers.color,
			user => {
				sendMessage(
					dbchat,
					user,
					req.headers.channel,
					req.headers.content,
					out => {
						res.send(out);
					}
				);
			}
		);
	});

	app.listen(3000, function () {
		console.log("Running NallanChat Server, port 3000");
	});
});
