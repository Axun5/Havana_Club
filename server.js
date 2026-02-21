const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");

function loadRums() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        var data = fs.readFileSync(DATA_FILE, "utf-8");
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
    if (age === 1) return "1 rok";
    if (age >= 2 && age <= 4) return age + " roky";
    return age + " let";
}

function serveStaticFile(res, filePath) {
    var fullPath = path.join(__dirname, filePath);
    var ext = path.extname(fullPath).toLowerCase();

    var mimeTypes = {
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp"
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

function saveBase64Image(base64String) {
    if (!base64String) {
        return null;
    }

    var matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
        return null;
    }

    var imageBuffer = Buffer.from(matches[2], "base64");
    var fileName = "upload_" + Date.now() + ".png";
    var savePath = path.join(PUBLIC_DIR, "images", fileName);

    fs.writeFileSync(savePath, imageBuffer);

    return "/public/images/" + fileName;
}

var HTML_HEAD = `
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <title>Havana Club Sklad</title>
    <link rel="stylesheet" href="/public/css/style.css">
    <script src="/public/js/client.js"></script>
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
                <div class="actions">
                    <a href="/detail/${r.id}" class="btn-detail">Detail</a>
                    <a href="/edit/${r.id}" class="btn-edit">Upravit</a>
                    <a href="/delete/${r.id}" class="btn-delete"
                       onclick="return confirm('Opravdu chcete smazat tento rum?')">Smazat</a>
                </div>
            </div>
        </div>
        `;
    }

    return `
    ${HTML_HEAD}
    <div class="add-btn-container">
        <a href="/add" class="btn-add-new">+ Přidat Nový Rum</a>
    </div>
    <div class="grid-container">
        ${cards}
    </div>
    ${HTML_FOOTER}
    `;
}

function renderFormPage(rum) {
    var isEdit = rum !== null;
    var action = isEdit ? "/edit/" + rum.id : "/add";
    var title = isEdit ? "Upravit: " + rum.name : "Přidat Nový Rum";

    var nameValue = isEdit ? rum.name : "";
    var ageValue = isEdit ? rum.age : "";
    var alcoholValue = isEdit ? rum.alcohol : "";
    var priceValue = isEdit ? rum.price : "";
    var imageValue = isEdit ? rum.image : "";

    var categories = ["White", "Gold", "Dark", "Premium", "Spiced"];
    var categoryOptions = "";
    for (var i = 0; i < categories.length; i++) {
        var selected = (isEdit && rum.category === categories[i]) ? " selected" : "";
        categoryOptions += '<option value="' + categories[i] + '"' + selected + '>' + categories[i] + '</option>';
    }

    return `
    ${HTML_HEAD}
    <div class="form-container">
        <h2 class="form-title">${title}</h2>

        <form method="POST" action="${action}">
            <div class="form-group">
                <label>Název rumu:</label>
                <input type="text" name="name" value="${nameValue}" required>
            </div>

            <div class="form-group">
                <label>Kategorie:</label>
                <select name="category">
                    ${categoryOptions}
                </select>
            </div>

            <div class="form-row">
                <div class="form-group form-half">
                    <label>Věk (let):</label>
                    <input type="number" name="age" value="${ageValue}" required>
                </div>
                <div class="form-group form-half">
                    <label>Alkohol (%):</label>
                    <input type="number" name="alcohol" step="0.1" value="${alcoholValue}" required>
                </div>
            </div>

            <div class="form-group">
                <label>Cena (Kč):</label>
                <input type="number" name="price" value="${priceValue}" required>
            </div>

            <div class="form-group">
                <label>Obrázek:</label>
                <input type="hidden" name="imageData" id="hiddenImageData">
                <input type="hidden" name="originalImage" value="${imageValue}">

                <div class="drop-zone" id="dropZone">
                    <p>Klikni nebo přetáhni obrázek sem</p>
                    <input type="file" id="fileInput" accept="image/*" class="file-input-hidden">
                    <img id="imagePreview" class="image-preview" src="${imageValue}" ${isEdit ? 'style="display:block"' : ''}>
                </div>
            </div>

            <button type="submit" class="submit-btn">${isEdit ? "Uložit změny" : "Přidat do skladu"}</button>
        </form>

        <div class="form-back">
            <a href="/" class="back-link">← Zpět na seznam</a>
        </div>
    </div>
    ${HTML_FOOTER}
    `;
}

function renderDetailPage(rum) {
    return `
    ${HTML_HEAD}
    <div class="detail-container">
        <h2 class="detail-title">${rum.name}</h2>
        <div class="detail-image">
            <img src="${rum.image}" alt="${rum.name}">
        </div>
        <div class="detail-params">
            <div class="detail-param">
                <span class="param-label">Kategorie</span>
                <span class="param-value">${rum.category}</span>
            </div>
            <div class="detail-param">
                <span class="param-label">Věk</span>
                <span class="param-value">${formatAge(rum.age)}</span>
            </div>
            <div class="detail-param">
                <span class="param-label">Obsah alkoholu</span>
                <span class="param-value">${rum.alcohol} %</span>
            </div>
        </div>
        <div class="detail-price">${rum.price} Kč</div>
        <div class="detail-actions">
            <a href="/edit/${rum.id}" class="btn-edit">Upravit</a>
            <a href="/" class="back-link">← Zpět na seznam</a>
        </div>
    </div>
    ${HTML_FOOTER}
    `;
}

var server = http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var pathname = parsedUrl.pathname;

    if (pathname.startsWith("/public/")) {
        return serveStaticFile(res, pathname.substring(1));
    }

    var rums = loadRums();

    if (pathname === "/" && req.method === "GET") {
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
        var body = "";
        req.on("data", function (chunk) { body += chunk; });
        req.on("end", function () {
            var params = new URLSearchParams(body);

            var maxId = 0;
            for (var i = 0; i < rums.length; i++) {
                if (rums[i].id > maxId) maxId = rums[i].id;
            }

            var finalImage = "/public/images/logo.png";
            var imageData = params.get("imageData");
            if (imageData && imageData.startsWith("data:image")) {
                var savedPath = saveBase64Image(imageData);
                if (savedPath) finalImage = savedPath;
            }

            var newRum = {
                id: maxId + 1,
                name: params.get("name") || "Neznámý rum",
                age: parseInt(params.get("age")) || 0,
                price: parseInt(params.get("price")) || 0,
                alcohol: parseFloat(params.get("alcohol")) || 0,
                category: params.get("category") || "White",
                image: finalImage
            };

            rums.push(newRum);
            saveRums(rums);

            res.writeHead(302, { "Location": "/" });
            res.end();
        });
        return;
    }

    if (pathname.startsWith("/detail/") && req.method === "GET") {
        var id = parseInt(pathname.split("/")[2]);
        var rum = null;
        for (var i = 0; i < rums.length; i++) {
            if (rums[i].id === id) { rum = rums[i]; break; }
        }
        if (rum) {
            var html = renderDetailPage(rum);
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html);
        } else {
            res.writeHead(404);
            res.end("Rum nenalezen");
        }
        return;
    }

    if (pathname.startsWith("/edit/") && req.method === "GET") {
        var id = parseInt(pathname.split("/")[2]);
        var rum = null;
        for (var i = 0; i < rums.length; i++) {
            if (rums[i].id === id) { rum = rums[i]; break; }
        }
        if (rum) {
            var html = renderFormPage(rum);
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html);
        } else {
            res.writeHead(404);
            res.end("Rum nenalezen");
        }
        return;
    }

    if (pathname.startsWith("/edit/") && req.method === "POST") {
        var id = parseInt(pathname.split("/")[2]);
        var body = "";
        req.on("data", function (chunk) { body += chunk; });
        req.on("end", function () {
            var params = new URLSearchParams(body);

            for (var i = 0; i < rums.length; i++) {
                if (rums[i].id === id) {
                    var finalImage = params.get("originalImage");
                    var imageData = params.get("imageData");
                    if (imageData && imageData.startsWith("data:image")) {
                        var savedPath = saveBase64Image(imageData);
                        if (savedPath) finalImage = savedPath;
                    }

                    rums[i].name = params.get("name") || rums[i].name;
                    rums[i].age = parseInt(params.get("age")) || 0;
                    rums[i].price = parseInt(params.get("price")) || 0;
                    rums[i].alcohol = parseFloat(params.get("alcohol")) || 0;
                    rums[i].category = params.get("category") || rums[i].category;
                    rums[i].image = finalImage;
                    break;
                }
            }

            saveRums(rums);
            res.writeHead(302, { "Location": "/" });
            res.end();
        });
        return;
    }

    if (pathname.startsWith("/delete/") && req.method === "GET") {
        var id = parseInt(pathname.split("/")[2]);
        var newRums = [];
        for (var i = 0; i < rums.length; i++) {
            if (rums[i].id !== id) newRums.push(rums[i]);
        }
        saveRums(newRums);
        res.writeHead(302, { "Location": "/" });
        res.end();
        return;
    }

    res.writeHead(404);
    res.end("404 Not Found");
});

server.listen(3000, function () {
    console.log("Server bezi na http://localhost:3000");
});
