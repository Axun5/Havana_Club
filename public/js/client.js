document.addEventListener("DOMContentLoaded", function () {

    const filterForm = document.getElementById("filterForm");
    const filterBtn = document.getElementById("filterBtn");

    if (filterForm && filterBtn) {
        setupFilterValidation();
    }

    function setupFilterValidation() {
        const filterPairs = [
            {
                minInput: filterForm.querySelector('input[name="minPrice"]'),
                maxInput: filterForm.querySelector('input[name="maxPrice"]'),
                errorSpan: document.getElementById("error-price"),
                groupDiv: document.getElementById("group-price")
            },
            {
                minInput: filterForm.querySelector('input[name="minAge"]'),
                maxInput: filterForm.querySelector('input[name="maxAge"]'),
                errorSpan: document.getElementById("error-age"),
                groupDiv: document.getElementById("group-age")
            },
            {
                minInput: filterForm.querySelector('input[name="minAlc"]'),
                maxInput: filterForm.querySelector('input[name="maxAlc"]'),
                errorSpan: document.getElementById("error-alc"),
                groupDiv: document.getElementById("group-alc")
            },
            {
                minInput: filterForm.querySelector('input[name="minVol"]'),
                maxInput: filterForm.querySelector('input[name="maxVol"]'),
                errorSpan: document.getElementById("error-vol"),
                groupDiv: document.getElementById("group-vol")
            }
        ];

        for (var i = 0; i < filterPairs.length; i++) {
            var pair = filterPairs[i];

            (function (p) {
                p.minInput.addEventListener("input", function () {
                    validateAllFilters(filterPairs);
                });
                p.maxInput.addEventListener("input", function () {
                    validateAllFilters(filterPairs);
                });
            })(pair);
        }

        validateAllFilters(filterPairs);
    }

    function validateAllFilters(filterPairs) {
        var hasError = false;

        for (var i = 0; i < filterPairs.length; i++) {
            var pair = filterPairs[i];
            var minVal = pair.minInput.value;
            var maxVal = pair.maxInput.value;
            var errorText = "";
            var minBad = false;
            var maxBad = false;

            if (minVal !== "" && Number(minVal) < 0) {
                errorText = 'Hodnota "Od" nesm\u00ed b\u00fdt z\u00e1porn\u00e1.';
                minBad = true;
            }

            if (maxVal !== "" && Number(maxVal) < 0) {
                if (errorText !== "") {
                    errorText = "Hodnoty nesm\u00ed b\u00fdt z\u00e1porn\u00e9.";
                } else {
                    errorText = 'Hodnota "Do" nesm\u00ed b\u00fdt z\u00e1porn\u00e1.';
                }
                maxBad = true;
            }

            if (!minBad && !maxBad && minVal !== "" && maxVal !== "") {
                if (Number(minVal) > Number(maxVal)) {
                    errorText = 'Hodnota "Od" nesm\u00ed b\u00fdt v\u011bt\u0161\u00ed ne\u017e "Do".';
                    minBad = true;
                    maxBad = true;
                }
            }

            if (minBad) {
                pair.minInput.classList.add("input-error");
            } else {
                pair.minInput.classList.remove("input-error");
            }

            if (maxBad) {
                pair.maxInput.classList.add("input-error");
            } else {
                pair.maxInput.classList.remove("input-error");
            }

            pair.errorSpan.textContent = errorText;

            if (minBad || maxBad) {
                hasError = true;
            }
        }

        if (hasError) {
            filterBtn.disabled = true;
            filterBtn.classList.add("btn-filter-disabled");
        } else {
            filterBtn.disabled = false;
            filterBtn.classList.remove("btn-filter-disabled");
        }
    }
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const preview = document.getElementById("imagePreview");
    const hiddenInput = document.getElementById("hiddenImageData");

    if (!dropZone) {
        return;
    }

    dropZone.addEventListener("click", function () {
        fileInput.click();
    });

    fileInput.addEventListener("change", function () {
        handleFileSelect();
    });

    dropZone.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropZone.style.borderColor = "#D3122A";
        dropZone.style.backgroundColor = "#fff0f0";
    });

    dropZone.addEventListener("dragleave", function () {
        dropZone.style.borderColor = "#ccc";
        dropZone.style.backgroundColor = "transparent";
    });

    dropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropZone.style.borderColor = "#ccc";
        dropZone.style.backgroundColor = "transparent";

        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    function handleFileSelect() {
        const file = fileInput.files[0];

        if (!file) {
            return;
        }

        const textElement = dropZone.querySelector("p");
        textElement.innerText = "Vybráno: " + file.name;

        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = "block";

            hiddenInput.value = e.target.result;
        };

        reader.readAsDataURL(file);
    }
});