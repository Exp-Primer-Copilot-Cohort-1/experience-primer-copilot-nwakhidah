// Create web server
// 1. Create a web server object
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {}; //cache object is where the contents of cached files are stored

// 2. Create a http server that invokes a function for each HTTP request received
var server = http.createServer(function(request, response) {
	var filePath = false;
	if (request.url == '/') {
		filePath = 'public/index.html'; //determine HTML file to be served by default
	} else {
		filePath = 'public' + request.url; //translate URL path to relative file path
	}
	var absPath = './' + filePath;
	serveStatic(response, cache, absPath); //serve static file
});

// 3. Start listening for HTTP requests on port 3000
server.listen(3000, function() {
	console.log("Server listening on port 3000.");
});

// Load custom Node module for handling Socket.IO messaging
var chatServer = require('./lib/chat_server');
chatServer.listen(server); //start Socket.IO server

// Load custom Node module for handling HTTP responses
function send404(response) {
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
}

// Load custom Node module for handling HTTP responses
function sendFile(response, filePath, fileContents) {
	response.writeHead(200, {'Content-Type': mime.lookup(path.basename(filePath))});
	response.end(fileContents);
}

// Load custom Node module for handling HTTP responses
function serveStatic(response, cache, absPath) {
	// Check if file is cached in memory
	if (cache[absPath]) {
		// Serve file from memory
		sendFile(response, absPath, cache[absPath]);
	} else {
		// Check if file exists
		fs.exists(absPath, function(exists) {
			if (exists) {
				// Read file from disk
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(response);
					} else {
						// Cache file in memory and serve file from disk
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			} else {
				// Send HTTP 404 response
