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

        const contentType = mimeTypes[ext] || "text/plain";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

const HTML_HEAD = `
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

const HTML_FOOTER = `
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
    let cards = "";

    for (let i = 0; i < rums.length; i++) {
        const r = rums[i];

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
    <div class="grid-container">
        ${cards}
    </div>
    ${HTML_FOOTER}
    `;
}

const server = http.createServer(function (req, res) {

    if (req.url.startsWith("/public/")) {
        return serveStaticFile(res, req.url.substring(1));
    }

    if (req.url === "/" && req.method === "GET") {
        const rums = loadRums();
        const html = renderMainPage(rums);
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
