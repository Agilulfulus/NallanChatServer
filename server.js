var url = require("./secret-url.js").url;

const express = require("express");
const app = express();
const mongo = require("mongodb");
const multer = require('multer');
const upload = multer();

function getMessages(db, channel, count, callback) {
	db.collection(channel)
		.find({})
		.sort({ _id: -1 })
		.limit(count)
		.toArray((err, res) => {
			if (err) throw err;
			callback(res.map(e => {
				e.content.data = undefined;
				return e;
			}));
		});
}

function getFile(db, channel, id, callback) {
	db.collection(channel).find({ _id: mongo.ObjectId(id) })
		.toArray((err, res) => {
			if (err) throw err;
			if (res.length > 0)
				callback(res[0].content.data);
			else
				callback(`<h2>FILE NOT FOUND`);
		});
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

mongo.MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
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
				res.send(encodeURIComponent(JSON.stringify(history)));
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

	app.get("/send", upload.none(), function (req, res) {
		let data = req.body
		console.log(data);
		login(
			dbmain,
			data.user,
			data.password,
			data.color,
			user => {
				sendMessage(
					dbchat,
					user,
					data.channel,
					data.content,
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
