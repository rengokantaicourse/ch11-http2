var fs = require("fs"),
	path = require("path"),
	https = require("https"),
	mime = require("mime"),
	pubDir = path.join(__dirname, "/htdocs");

var server = https.createServer({
	key: fs.readFileSync(path.join(__dirname, "/crt/localhost.key")),
	cert: fs.readFileSync(path.join(__dirname, "/crt/localhost.crt"))
}, function(request, response){
	var filename = path.join(pubDir, request.url),
		contentType = mime.lookup(filename);

	if((filename.indexOf(pubDir) === 0) && fs.existsSync(filename) && fs.statSync(filename).isFile()){
		response.setHeader("content-type", contentType);
		response.writeHead(200);
		var fileStream = fs.createReadStream(filename);
		fileStream.pipe(response);
		fileStream.on("finish", response.end);
	}
	else{
		response.writeHead(404);
		response.end();
	}
});

server.listen(8442);