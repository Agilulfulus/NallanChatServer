var MongoClient = require("mongodb").MongoClient;
var url = require("../secret-url.js").url;

MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
	if (err) throw err;
	var dbo = db.db("main");
	dbo
		.collection("users")
		.find({})
		.toArray((err, res) => {
			console.log(res);
			db.close();
		});
});
