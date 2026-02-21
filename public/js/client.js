document.addEventListener("DOMContentLoaded", function () {

    var dropZone = document.getElementById("dropZone");
    var fileInput = document.getElementById("fileInput");
    var preview = document.getElementById("imagePreview");
    var hiddenInput = document.getElementById("hiddenImageData");

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
        var file = fileInput.files[0];

        if (!file) {
            return;
        }

        var textElement = dropZone.querySelector("p");
        textElement.innerText = "Vybráno: " + file.name;

        var reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = "block";

            hiddenInput.value = e.target.result;
        };

        reader.readAsDataURL(file);
    }
});
