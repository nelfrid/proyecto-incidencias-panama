const API_URL = "http://127.0.0.1:8000/incidente";

let locations = {
    "Bocas del Toro": {
        "Bocas del Toro": ["Bocas del Toro", "Bastimentos", "Boca del Drago"],
        "Changuinola": ["Changuinola", "El Empalme", "Guabito"]
    },
    "Chiriquí": {
        "David": ["David", "Las Lomas", "Pedregal"],
        "Boquete": ["Bajo Boquete", "Alto Boquete", "Caldera"],
        "Tierras Altas": ["Volcán", "Cerro Punta", "Cuesta de Piedra"]
    },
    "Coclé": {
        "Penonomé": ["Penonomé", "Cañaveral", "El Coco"],
        "Antón": ["Antón", "El Valle", "Río Hato"]
    },
    "Colón": {
        "Colón": ["Barrio Norte", "Barrio Sur", "Cristóbal"],
        "Portobelo": ["Portobelo", "Cacique", "Isla Grande"]
    },
    "Darién": {
        "Chepigana": ["La Palma", "Garachiné", "Santa Fe"],
        "Pinogana": ["El Real de Santa María", "Yaviza", "Metetí"]
    },
    "Herrera": {
        "Chitré": ["Chitré", "La Arena", "Monagrillo"],
        "Ocú": ["Ocú", "Cerro Largo", "Los Llanos"]
    },
    "Los Santos": {
        "Las Tablas": ["Las Tablas", "La Palma", "Santo Domingo"],
        "Los Santos": ["La Villa de Los Santos", "El Guásimo", "La Colorada"]
    },
    "Panamá": {
        "Panamá": ["Bella Vista", "Juan Díaz", "San Francisco"],
        "San Miguelito": ["Amelia Denis de Icaza", "Belisario Porras", "Rufina Alfaro"],
        "Chepo": ["Chepo", "Las Margaritas", "Tortí"]
    },
    "Panamá Oeste": {
        "Arraiján": ["Arraiján", "Burunga", "Vista Alegre"],
        "La Chorrera": ["Barrio Balboa", "Barrio Colón", "Puerto Caimito"]
    },
    "Veraguas": {
        "Santiago": ["Santiago", "La Colorada", "San Martín"],
        "Soná": ["Soná", "Bahía Honda", "Río Grande"]
    }
};

const form = document.querySelector("#incident-form");
const province = document.querySelector("#province");
const district = document.querySelector("#district");
const township = document.querySelector("#township");
const submitButton = document.querySelector("#submit-button");
const message = document.querySelector("#form-message");

function fillSelect(select, values, placeholder) {
    select.innerHTML = "";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = placeholder;
    select.appendChild(emptyOption);
    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function updateSummary() {
    document.querySelector("#summary-province").textContent = province.value || "Sin seleccionar";
    document.querySelector("#summary-district").textContent = district.value || "Sin seleccionar";
    document.querySelector("#summary-township").textContent = township.value || "Sin seleccionar";
    const selectedType = form.querySelector('input[name="tipoIncidente"]:checked');
    document.querySelector("#summary-type").textContent = selectedType ? selectedType.value : "Sin seleccionar";
}

function clearError(field) {
    field.removeAttribute("aria-invalid");
    const error = document.querySelector(`#${field.id}-error`);
    if (error) error.textContent = "";
}

function validateForm() {
    let valid = true;
    [province, district, township].forEach(field => {
        clearError(field);
        if (!field.value) {
            field.setAttribute("aria-invalid", "true");
            document.querySelector(`#${field.id}-error`).textContent = "Selecciona una opción.";
            valid = false;
        }
    });
    const selectedType = form.querySelector('input[name="tipoIncidente"]:checked');
    document.querySelector("#type-error").textContent = selectedType ? "" : "Selecciona el tipo de incidencia.";
    return valid && Boolean(selectedType);
}

function showMessage(text, state) {
    message.textContent = text;
    message.className = `form-message ${state}`;
    message.hidden = false;
}

function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButton.querySelector(".button-label").hidden = isSubmitting;
    submitButton.querySelector(".button-loading").hidden = !isSubmitting;
}

province.addEventListener("change", () => {
    clearError(province);
    const districts = province.value ? Object.keys(locations[province.value]) : [];
    fillSelect(district, districts, province.value ? "Selecciona un distrito" : "Selecciona primero una provincia");
    fillSelect(township, [], "Selecciona primero un distrito");
    district.disabled = !province.value;
    township.disabled = true;
    clearError(district);
    clearError(township);
    updateSummary();
});

district.addEventListener("change", () => {
    clearError(district);
    const townships = district.value ? locations[province.value][district.value] : [];
    fillSelect(township, townships, district.value ? "Selecciona un corregimiento" : "Selecciona primero un distrito");
    township.disabled = !district.value;
    clearError(township);
    updateSummary();
});

township.addEventListener("change", () => { clearError(township); updateSummary(); });
form.querySelectorAll('input[name="tipoIncidente"]').forEach(input => input.addEventListener("change", () => {
    document.querySelector("#type-error").textContent = "";
    updateSummary();
}));

form.addEventListener("submit", async event => {
    event.preventDefault();
    message.hidden = true;
    if (!validateForm()) {
        showMessage("Revisa los campos señalados antes de enviar el reporte.", "error");
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
    }

    const payload = {
        provincia: province.value,
        distrito: district.value,
        corregimiento: township.value,
        tipoIncidente: form.querySelector('input[name="tipoIncidente"]:checked').value
    };

    setSubmitting(true);
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.Mensaje || "El servidor rechazó el reporte.");

        showMessage(data.Message || "Incidente creado correctamente.", "success");
        form.reset();
        fillSelect(district, [], "Selecciona primero una provincia");
        fillSelect(township, [], "Selecciona primero un distrito");
        district.disabled = true;
        township.disabled = true;
        updateSummary();
    } catch (error) {
        const networkMessage = error instanceof TypeError
            ? "No fue posible conectar con la API. Verifica que FastAPI esté activo en el puerto 8000 y que el origen del frontend esté permitido."
            : error.message;
        showMessage(networkMessage, "error");
    } finally {
        setSubmitting(false);
    }
});

async function initializeLocations() {
    const catalogUrl = "https://gist.githubusercontent.com/Yizack/cbe7cef5572e6b832da0e9bd3454b312/raw/5c6fcc23e657cef0c318d3b28a30ee4ac5e012d1/provincias.json";
    const provinceNames = new Set([
        "Bocas del Toro", "Coclé", "Colón", "Chiriquí", "Darién",
        "Herrera", "Los Santos", "Panamá", "Panamá Oeste", "Veraguas"
    ]);

    province.disabled = true;
    fillSelect(province, [], "Cargando provincias...");

    try {
        const response = await fetch(catalogUrl);
        if (!response.ok) throw new Error("No se pudo descargar el catálogo territorial.");
        const data = await response.json();
        const completeLocations = {};

        data.provincia
            .filter(item => provinceNames.has(item.nombre))
            .forEach(item => {
                completeLocations[item.nombre] = {};
                item.distrito.forEach(districtItem => {
                    completeLocations[item.nombre][districtItem.nombre] = districtItem.corregimientos;
                });
            });

        if (Object.keys(completeLocations).length !== provinceNames.size) {
            throw new Error("El catálogo territorial está incompleto.");
        }
        locations = completeLocations;
    } catch (error) {
        showMessage("No se pudo cargar el catálogo completo. Se muestran ubicaciones de respaldo.", "error");
    } finally {
        fillSelect(province, Object.keys(locations).sort((a, b) => a.localeCompare(b, "es")), "Selecciona una provincia");
        province.disabled = false;
        updateSummary();
    }
}

initializeLocations();
