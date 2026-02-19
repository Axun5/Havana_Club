const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const DATA_FILE = path.join(__dirname, "data.json");

function loadRums() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }

        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (chyba) {
        console.error("Chyba pri nacitani:", chyba);
        return [];
    }
}

function saveRums(rums) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(rums, null, 2), "utf-8");
}

function formatAge(age) {
    if (age === 1) {
        return "1 rok";
    }
    if (age >= 2 && age <= 4) {
        return age + " roky";
    }
    return age + " let";
}

function serveStaticFile(res, filePath) {
    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(fullPath).toLowerCase();

    const mimeTypes = {
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg"
    };

    fs.readFile(fullPath, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end("Soubor nenalezen");
            return;
        }

        var contentType = mimeTypes[ext] || "text/plain";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

var HTML_HEAD = `
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <title>Havana Club Sklad</title>
    <link rel="stylesheet" href="/public/css/style.css">
</head>
<body>
    <header>
        <a href="/">
            <img src="/public/images/logo.png" alt="Havana Club" class="logo">
        </a>
        <h1>Skladová Evidence</h1>
    </header>
`;

var HTML_FOOTER = `
    <footer>
        <p>&copy; 2026 Havana Club Sklad. Všechna práva vyhrazena.</p>
        <p>
            Vytvořil
            <a href="https://adamkoukal.cz" target="_blank" class="author-link">Adam Koukal</a>
        </p>
    </footer>
</body>
</html>
`;

function renderMainPage(rums) {
    var cards = "";

    for (var i = 0; i < rums.length; i++) {
        var r = rums[i];

        cards += `
        <div class="card">
            <div class="card-image">
                <img src="${r.image}" alt="${r.name}">
            </div>
            <div class="card-info">
                <h3>${r.name}</h3>
                <div class="badges">
                    <span>${formatAge(r.age)}</span>
                    <span>${r.category}</span>
                    <span>${r.alcohol}% alk.</span>
                </div>
                <div class="price-tag">${r.price} Kč</div>
            </div>
        </div>
        `;
    }

    return `
    ${HTML_HEAD}
    <div class="top-bar">
        <a href="/add" class="btn btn-add">+ Přidat rum</a>
    </div>
    <div class="grid-container">
        ${cards}
    </div>
    ${HTML_FOOTER}
    `;
}

function renderFormPage(rum) {
    var isEdit = rum !== null;
    var title = isEdit ? "Upravit rum" : "Přidat nový rum";
    var action = isEdit ? "/edit/" + rum.id : "/add";

    var name = isEdit ? rum.name : "";
    var age = isEdit ? rum.age : "";
    var price = isEdit ? rum.price : "";
    var alcohol = isEdit ? rum.alcohol : "";
    var category = isEdit ? rum.category : "White";
    var image = isEdit ? rum.image : "";

    var categories = ["White", "Gold", "Dark", "Premium", "Spiced", "Overproof"];

    var categoryOptions = "";
    for (var i = 0; i < categories.length; i++) {
        var selected = categories[i] === category ? " selected" : "";
        categoryOptions += '<option value="' + categories[i] + '"' + selected + '>' + categories[i] + '</option>';
    }

    return `
    ${HTML_HEAD}
    <div class="form-container">
        <h2>${title}</h2>
        <form method="POST" action="${action}">
            <div class="form-group">
                <label>Název:</label>
                <input type="text" name="name" value="${name}" required>
            </div>
            <div class="form-group">
                <label>Stáří (roky):</label>
                <input type="number" name="age" value="${age}" min="0" required>
            </div>
            <div class="form-group">
                <label>Obsah alkoholu (%):</label>
                <input type="number" name="alcohol" value="${alcohol}" step="0.1" required>
            </div>
            <div class="form-group">
                <label>Cena (Kč):</label>
                <input type="number" name="price" value="${price}" required>
            </div>
            <div class="form-group">
                <label>Kategorie:</label>
                <select name="category">
                    ${categoryOptions}
                </select>
            </div>
            <div class="form-group">
                <label>URL obrázku:</label>
                <input type="text" name="image" value="${image}">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-add">${isEdit ? "Uložit" : "Přidat"}</button>
                <a href="/" class="btn btn-back">Zpět</a>
            </div>
        </form>
    </div>
    ${HTML_FOOTER}
    `;
}

function parseBody(req, callback) {
    var body = "";

    req.on("data", function (chunk) {
        body += chunk.toString();
    });

    req.on("end", function () {
        var params = {};
        var pairs = body.split("&");

        for (var i = 0; i < pairs.length; i++) {
            var parts = pairs[i].split("=");
            var key = decodeURIComponent(parts[0]);
            var value = decodeURIComponent(parts[1] || "").replace(/\+/g, " ");
            params[key] = value;
        }

        callback(params);
    });
}

var server = http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var pathname = parsedUrl.pathname;

    if (pathname.startsWith("/public/")) {
        return serveStaticFile(res, pathname.substring(1));
    }

    if (pathname === "/" && req.method === "GET") {
        var rums = loadRums();
        var html = renderMainPage(rums);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
    }

    if (pathname === "/add" && req.method === "GET") {
        var html = renderFormPage(null);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
    }

    if (pathname === "/add" && req.method === "POST") {
        parseBody(req, function (params) {
            var rums = loadRums();

            var maxId = 0;
            for (var i = 0; i < rums.length; i++) {
                if (rums[i].id > maxId) {
                    maxId = rums[i].id;
                }
            }

            var newRum = {
                id: maxId + 1,
                name: params.name || "Neznámý rum",
                age: parseInt(params.age) || 0,
                price: parseInt(params.price) || 0,
                alcohol: parseFloat(params.alcohol) || 0,
                category: params.category || "White",
                image: params.image || "/public/images/placeholder.png"
            };

            rums.push(newRum);
            saveRums(rums);

            res.writeHead(302, { "Location": "/" });
            res.end();
        });
        return;
    }

    res.writeHead(404);
    res.end("404 Not Found");
});

server.listen(3000, function () {
    console.log("Server bezi na http://localhost:3000");
});
