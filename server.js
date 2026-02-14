const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer(function (req, res) {
    const htmlPath = path.join(__dirname, "index.html");

    fs.readFile(htmlPath, "utf-8", function (err, data) {
        if (err) {
            res.writeHead(500);
            res.end("Chyba serveru");
            return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
    });
});

server.listen(3000, function () {
    console.log("Server bezi na http://localhost:3000");
});
