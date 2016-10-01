var fs = require("fs"),
	path = require("path"),
	http2 = require("spdy"),
	mime = require("mime"),
	jsdom = require("jsdom"),
	pubDir = path.join(__dirname, "/htdocs");

var server = http2.createServer({
	key: fs.readFileSync(path.join(__dirname, "/crt/localhost.key")),
	cert: fs.readFileSync(path.join(__dirname, "/crt/localhost.crt"))
}, function(request, response){
	var filename = path.join(pubDir, request.url),
		contentType = mime.lookup(filename),
		protocolVersion = request.isSpdy ? "http2" : "http1";

	if((filename.indexOf(pubDir) === 0) && fs.existsSync(filename) && fs.statSync(filename).isFile()){
		response.writeHead(200, {
			"content-type": contentType,
			"cache-control": "max-age=3600"
		});

		if(protocolVersion === "http1" && filename.indexOf(".html") !== -1){
			fs.readFile(filename, function(error, data){
				jsdom.env(data.toString(), function(error, window){
					window.document.documentElement.classList.add(protocolVersion);

					var scripts = window.document.querySelectorAll("script:not([crossorigin])"),
						jQueryScript = window.document.querySelector("script[crossorigin]"),
						concatenatedScript = window.document.createElement("script");
						concatenatedScript.src = "js/scripts.min.js";

					for(var i in scripts){
						scripts[i].remove();
					}

					jQueryScript.parentNode.insertBefore(concatenatedScript, jQueryScript.nextSibling);

					var newDocument = "<!doctype html>" + window.document.documentElement.outerHTML;
					response.end(newDocument);
				});
			});
		}
		else{
			var fileStream = fs.createReadStream(filename);
			fileStream.pipe(response);
			fileStream.on("finish", response.end);
		}
	}
	else{
		response.writeHead(404);
		response.end();
	}
});

server.listen(8443);