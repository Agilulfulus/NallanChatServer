var MongoClient = require("mongodb").MongoClient;
var url = require("../secret-url.js").url;

MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
	if (err) throw err;
	var dbo = db.db("chat");
	dbo
		.collection(process.argv[2])
		.find({})
		.toArray((err, res) => {
			console.log(res);
			dbo.dropCollection(process.argv[2], () => {
				db.close();
			});
		});
});