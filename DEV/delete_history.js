var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://Nallantli:bpshpa243@157.230.208.158:27017/";

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
