const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");

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
        console.error("Chyba při načítání dat:", chyba);
        return [];
    }
}

function saveRums(rums) {
    const jsonText = JSON.stringify(rums, null, 2);
    fs.writeFileSync(DATA_FILE, jsonText, "utf-8");
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

function formatVolume(volume) {
    return volume + " l";
}

function serveStaticFile(res, filePath) {
    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(fullPath).toLowerCase();

    const mimeTypes = {
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

        const contentType = mimeTypes[ext] || "text/plain";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

function saveBase64Image(base64String) {
    if (!base64String) {
        return null;
    }

    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
        return null;
    }

    const imageBuffer = Buffer.from(matches[2], "base64");

    const fileName = "upload_" + Date.now() + ".png";
    const savePath = path.join(PUBLIC_DIR, "images", fileName);

    fs.writeFileSync(savePath, imageBuffer);

    return "/public/images/" + fileName;
}

function sendHtml(res, htmlContent) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlContent);
}

function validateRumData(name, age, alcohol, price, volume) {
    const errors = [];

    if (!name || name.trim().length === 0) {
        errors.push("Název rumu nesmí být prázdný.");
    }

    if (isNaN(age) || age < 0) {
        errors.push("Věk musí být nezáporné číslo.");
    }
    if (age > 100) {
        errors.push("Věk nesmí být vyšší než 100 let.");
    }

    if (isNaN(alcohol) || alcohol < 0) {
        errors.push("Obsah alkoholu musí být nezáporné číslo.");
    }
    if (alcohol > 100) {
        errors.push("Obsah alkoholu nesmí být vyšší než 100 %.");
    }

    if (isNaN(price) || price <= 0) {
        errors.push("Cena musí být kladné číslo.");
    }

    if (isNaN(volume) || volume <= 0) {
        errors.push("Objem musí být kladné číslo.");
    }
    if (volume > 10) {
        errors.push("Objem nesmí být vyšší než 10 litrů.");
    }

    return errors;
}

function renderErrorPage(errors, backUrl) {
    let errorList = "";
    for (let i = 0; i < errors.length; i++) {
        errorList += "<li>" + errors[i] + "</li>";
    }

    return `
    ${HTML_HEAD}
    <div class="form-container">
        <h2 class="form-title">Chyba ve formuláři</h2>
        <div class="error-box">
            <p>Formulář obsahuje následující chyby:</p>
            <ul>${errorList}</ul>
        </div>
        <div class="form-back">
            <a href="${backUrl}" class="back-link">← Zpět na formulář</a>
        </div>
    </div>
    ${HTML_FOOTER}
    `;
}

const HTML_HEAD = `
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

function renderMainPage(rums, q) {
    if (!q) {
        q = {};
    }

    let filtered = rums;

    if (q.minPrice) {
        filtered = filtered.filter(function (r) {
            return r.price >= Number(q.minPrice);
        });
    }
    if (q.maxPrice) {
        filtered = filtered.filter(function (r) {
            return r.price <= Number(q.maxPrice);
        });
    }

    if (q.minAge) {
        filtered = filtered.filter(function (r) {
            return r.age >= Number(q.minAge);
        });
    }
    if (q.maxAge) {
        filtered = filtered.filter(function (r) {
            return r.age <= Number(q.maxAge);
        });
    }

    if (q.minAlc) {
        filtered = filtered.filter(function (r) {
            return r.alcohol >= Number(q.minAlc);
        });
    }
    if (q.maxAlc) {
        filtered = filtered.filter(function (r) {
            return r.alcohol <= Number(q.maxAlc);
        });
    }

    if (q.minVol) {
        filtered = filtered.filter(function (r) {
            return r.volume >= Number(q.minVol);
        });
    }
    if (q.maxVol) {
        filtered = filtered.filter(function (r) {
            return r.volume <= Number(q.maxVol);
        });
    }

    let cards = "";

    if (filtered.length === 0) {
        cards = '<p class="no-results">Žádné rumy neodpovídají zadaným filtrům.</p>';
    } else {
        for (let i = 0; i < filtered.length; i++) {
            const r = filtered[i];

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
                        <span>${formatVolume(r.volume)}</span>
                    </div>
                    <div class="price-tag">${r.price} Kč</div>
                    <div class="actions">
                        <a href="/detail/${r.id}" class="btn-detail">Detail</a>
                        <a href="/edit/${r.id}" class="btn-edit">Upravit</a>
                        <a href="/delete/${r.id}" class="btn-delete" onclick="return confirm('Opravdu chcete smazat tento rum?')">Smazat</a>
                    </div>
                </div>
            </div>
            `;
        }
    }

    return `
    ${HTML_HEAD}

    <div class="filters">
        <form method="GET" action="/" id="filterForm">
            <div class="filter-row">

                <div class="filter-group" id="group-price">
                    <label>Cena (Kč)</label>
                    <div class="range-inputs">
                        <input type="number" name="minPrice" placeholder="Od" min="0" value="${q.minPrice || ""}">
                        <span class="range-dash">-</span>
                        <input type="number" name="maxPrice" placeholder="Do" min="0" value="${q.maxPrice || ""}">
                    </div>
                    <span class="filter-error" id="error-price"></span>
                </div>

                <div class="filter-group" id="group-age">
                    <label>Věk (roky)</label>
                    <div class="range-inputs">
                        <input type="number" name="minAge" placeholder="Od" min="0" value="${q.minAge || ""}">
                        <span class="range-dash">-</span>
                        <input type="number" name="maxAge" placeholder="Do" min="0" value="${q.maxAge || ""}">
                    </div>
                    <span class="filter-error" id="error-age"></span>
                </div>

                <div class="filter-group" id="group-alc">
                    <label>Alkohol (%)</label>
                    <div class="range-inputs">
                        <input type="number" name="minAlc" placeholder="Od" min="0" value="${q.minAlc || ""}">
                        <span class="range-dash">-</span>
                        <input type="number" name="maxAlc" placeholder="Do" min="0" value="${q.maxAlc || ""}">
                    </div>
                    <span class="filter-error" id="error-alc"></span>
                </div>

                <div class="filter-group" id="group-vol">
                    <label>Objem (litry)</label>
                    <div class="range-inputs">
                        <input type="number" name="minVol" placeholder="Od" step="0.1" min="0" value="${q.minVol || ""}">
                        <span class="range-dash">-</span>
                        <input type="number" name="maxVol" placeholder="Do" step="0.1" min="0" value="${q.maxVol || ""}">
                    </div>
                    <span class="filter-error" id="error-vol"></span>
                </div>

            </div>

            <button type="submit" class="btn-filter" id="filterBtn">Filtrovat</button>
            <div class="filter-reset">
                <a href="/" class="filter-reset-link">Zrušit filtry</a>
            </div>
        </form>
    </div>

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
    const isEdit = !!rum;
    const action = isEdit ? "/edit/" + rum.id : "/add";
    const title = isEdit ? "Upravit: " + rum.name : "Přidat Nový Rum";

    const nameValue = isEdit ? rum.name : "";
    const ageValue = isEdit ? rum.age : "";
    const alcoholValue = isEdit ? rum.alcohol : "";
    const priceValue = isEdit ? rum.price : "";
    const volumeValue = isEdit ? rum.volume : "0.7";
    const descriptionValue = isEdit ? rum.description : "";
    const imageValue = isEdit ? rum.image : "";

    function categoryOption(value, label) {
        const selected = (isEdit && rum.category === value) ? "selected" : "";
        return '<option value="' + value + '" ' + selected + '>' + label + '</option>';
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
                    ${categoryOption("White", "White")}
                    ${categoryOption("Gold", "Gold")}
                    ${categoryOption("Dark", "Dark")}
                    ${categoryOption("Spiced", "Spiced")}
                    ${categoryOption("Premium", "Premium")}
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

            <div class="form-row">
                <div class="form-group form-half">
                    <label>Cena (Kč):</label>
                    <input type="number" name="price" value="${priceValue}" required>
                </div>
                <div class="form-group form-half">
                    <label>Objem (litry):</label>
                    <input type="number" name="volume" step="0.1" value="${volumeValue}" required>
                </div>
            </div>

            <div class="form-group">
                <label>Popis rumu:</label>
                <textarea name="description" rows="4" placeholder="Napište krátký popis rumu...">${descriptionValue}</textarea>
            </div>

            <div class="form-group">
                <label>Obrázek:</label>
                <input type="hidden" name="imageData" id="hiddenImageData">
                <input type="hidden" name="originalImage" value="${imageValue}">

                <div class="drop-zone" id="dropZone">
                    <p>Klikni nebo přetáhni obrázek sem</p>
                    <input type="file" id="fileInput" accept="image/*" class="file-input-hidden">
                    <img id="imagePreview" class="image-preview ${isEdit ? 'image-preview-visible' : ''}" src="${imageValue}">
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
    const popis = rum.description || "Popis tohoto rumu zatím nebyl přidán.";

    return `
    ${HTML_HEAD}

    <div class="detail-container">
        <h2 class="detail-title">${rum.name}</h2>

        <div class="detail-content">
            <div class="detail-image">
                <img src="${rum.image}" alt="${rum.name}">
            </div>

            <div class="detail-info">
                <div class="detail-description">
                    <h3>O tomto rumu</h3>
                    <p>${popis}</p>
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
                    <div class="detail-param">
                        <span class="param-label">Objem</span>
                        <span class="param-value">${formatVolume(rum.volume)}</span>
                    </div>
                </div>

                <div class="detail-price">${rum.price} Kč</div>

                <div class="detail-actions">
                    <a href="/edit/${rum.id}" class="btn-edit">Upravit</a>
                    <a href="/" class="back-link">← Zpět na seznam</a>
                </div>
            </div>
        </div>
    </div>

    ${HTML_FOOTER}
    `;
}

const server = http.createServer(function (req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathName = parsedUrl.pathname;
    const method = req.method;

    if (pathName.startsWith("/public/")) {
        const relativePath = pathName.substring(1);
        return serveStaticFile(res, relativePath);
    }

    const rums = loadRums();

    if (pathName === "/" && method === "GET") {
        const html = renderMainPage(rums, parsedUrl.query);
        return sendHtml(res, html);
    }

    if (pathName === "/add" && method === "GET") {
        const html = renderFormPage(null);
        return sendHtml(res, html);
    }

    if (pathName === "/add" && method === "POST") {
        let body = "";

        req.on("data", function (chunk) {
            body += chunk;
        });

        req.on("end", function () {
            const params = new URLSearchParams(body);

            const name = params.get("name");
            const age = Number(params.get("age"));
            const alcohol = Number(params.get("alcohol"));
            const price = Number(params.get("price"));
            const volume = Number(params.get("volume")) || 0.7;

            const errors = validateRumData(name, age, alcohol, price, volume);

            if (errors.length > 0) {
                const html = renderErrorPage(errors, "/add");
                return sendHtml(res, html);
            }

            let newId = 1;
            if (rums.length > 0) {
                const maxId = Math.max(...rums.map(function (r) {
                    return r.id;
                }));
                newId = maxId + 1;
            }

            let finalImage = "/public/images/logo.png"; 
            const imageData = params.get("imageData");

            if (imageData && imageData.startsWith("data:image")) {
                const savedPath = saveBase64Image(imageData);
                if (savedPath) {
                    finalImage = savedPath;
                }
            }

            const newRum = {
                id: newId,
                name: name,
                category: params.get("category"),
                age: age,
                alcohol: alcohol,
                price: price,
                volume: volume,
                image: finalImage,
                description: params.get("description") || ""
            };

            rums.push(newRum);
            saveRums(rums);

            res.writeHead(302, { "Location": "/" });
            res.end();
        });

        return;
    }

    if (pathName.startsWith("/edit/") && method === "GET") {
        const id = Number(pathName.split("/")[2]);
        const rum = rums.find(function (r) {
            return r.id === id;
        });

        if (rum) {
            const html = renderFormPage(rum);
            return sendHtml(res, html);
        }

        return res.end("Rum s tímto ID nebyl nalezen.");
    }

    if (pathName.startsWith("/edit/") && method === "POST") {
        const id = Number(pathName.split("/")[2]);
        let body = "";

        req.on("data", function (chunk) {
            body += chunk;
        });

        req.on("end", function () {
            const params = new URLSearchParams(body);
            const index = rums.findIndex(function (r) {
                return r.id === id;
            });

            const name = params.get("name");
            const age = Number(params.get("age"));
            const alcohol = Number(params.get("alcohol"));
            const price = Number(params.get("price"));
            const volume = Number(params.get("volume")) || 0.7;

            const errors = validateRumData(name, age, alcohol, price, volume);

            if (errors.length > 0) {
                const html = renderErrorPage(errors, "/edit/" + id);
                return sendHtml(res, html);
            }

            if (index !== -1) {
                let finalImage = params.get("originalImage");
                const imageData = params.get("imageData");

                if (imageData && imageData.startsWith("data:image")) {
                    const savedPath = saveBase64Image(imageData);
                    if (savedPath) {
                        finalImage = savedPath;
                    }
                }

                rums[index].name = name;
                rums[index].category = params.get("category");
                rums[index].age = age;
                rums[index].alcohol = alcohol;
                rums[index].price = price;
                rums[index].volume = volume;
                rums[index].image = finalImage;
                rums[index].description = params.get("description") || "";

                saveRums(rums);
            }

            res.writeHead(302, { "Location": "/" });
            res.end();
        });

        return;
    }

    if (pathName.startsWith("/delete/") && method === "GET") {
        const id = Number(pathName.split("/")[2]);

        const remaining = rums.filter(function (r) {
            return r.id !== id;
        });

        saveRums(remaining);

        res.writeHead(302, { "Location": "/" });
        res.end();

        return;
    }

    if (pathName.startsWith("/detail/") && method === "GET") {
        const id = Number(pathName.split("/")[2]);
        const rum = rums.find(function (r) {
            return r.id === id;
        });

        if (rum) {
            const html = renderDetailPage(rum);
            return sendHtml(res, html);
        }

        return res.end("Rum s tímto ID nebyl nalezen.");
    }

    res.writeHead(404);
    res.end("404 - Stránka nenalezena");
});

server.listen(3000, function () {
    console.log("Server běží na http://localhost:3000");
});