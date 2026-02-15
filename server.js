const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function loadRums() {
    try {
        const existuje = fs.existsSync(DATA_FILE);

        if (!existuje) {
            return [];
        }

        const data = fs.readFileSync(DATA_FILE, "utf-8");
        const rumy = JSON.parse(data);

        return rumy;
    } catch (chyba) {
        console.error("Chyba pri nacitani:", chyba);
        return [];
    }
}

function serveStaticFile(res, filePath) {
    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(fullPath).toLowerCase();

    const mimeTypes = {
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg"
    };

    fs.readFile(fullPath, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end("Soubor nenalezen");
            return;
        }

        const contentType = mimeTypes[ext] || "text/plain";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

const server = http.createServer(function (req, res) {

    if (req.url.startsWith("/public/")) {
        return serveStaticFile(res, req.url.substring(1));
    }

    if (req.url === "/" && req.method === "GET") {
        const rums = loadRums();

        let rumList = "";
        for (let i = 0; i < rums.length; i++) {
            rumList += "<tr>";
            rumList += "<td>" + rums[i].name + "</td>";
            rumList += "<td>" + rums[i].age + " let</td>";
            rumList += "<td>" + rums[i].alcohol + " %</td>";
            rumList += "<td>" + rums[i].price + " Kč</td>";
            rumList += "</tr>";
        }

        const html = `
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <title>Havana Club Sklad</title>
    <link rel="stylesheet" href="/public/css/style.css">
</head>
<body>
    <header>
        <h1>Havana Club - Skladová Evidence</h1>
    </header>

    <h2>Seznam rumů</h2>
    <table border="1" cellpadding="10">
        <tr>
            <th>Název</th>
            <th>Věk</th>
            <th>Alkohol</th>
            <th>Cena</th>
        </tr>
        ${rumList}
    </table>

    <footer>
        <p>&copy; 2026 Havana Club Sklad</p>
    </footer>
</body>
</html>
        `;

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
    }

    res.writeHead(404);
    res.end("404 Not Found");
});

server.listen(3000, function () {
    console.log("Server bezi na http://localhost:3000");
});
