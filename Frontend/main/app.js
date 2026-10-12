const incidents = [
    { id: 1, type: "Deslizamiento", province: "Chiriquí", district: "Boquete", township: "Bajo Boquete", severity: "Alta", date: "2026-10-10T18:35:00", description: "Deslizamiento parcial cerca de una vía secundaria después de lluvias continuas.", affected: 6, assistance: true },
    { id: 2, type: "Terremoto", province: "Panamá", district: "Panamá", township: "San Francisco", severity: "Baja", date: "2026-10-09T07:12:00", description: "Movimiento leve percibido en varios edificios. No se observan daños visibles.", affected: 0, assistance: false },
    { id: 3, type: "Deslizamiento", province: "Colón", district: "Colón", township: "Cristóbal", severity: "Media", date: "2026-10-08T15:48:00", description: "Tierra y vegetación bloquean parcialmente el acceso a una comunidad.", affected: 14, assistance: true },
    { id: 4, type: "Terremoto", province: "Veraguas", district: "Santiago", township: "Santiago", severity: "Media", date: "2026-10-06T22:05:00", description: "Movimiento sentido por residentes del área urbana, pendiente de verificación.", affected: 2, assistance: false },
    { id: 5, type: "Deslizamiento", province: "Chiriquí", district: "Tierras Altas", township: "Volcán", severity: "Alta", date: "2026-10-05T11:20:00", description: "Caída de material sobre la carretera con afectación temporal del tránsito.", affected: 9, assistance: true }
];

const filtersForm = document.querySelector("#filters");
const provinceFilter = document.querySelector("#province-filter");
const districtFilter = document.querySelector("#district-filter");
const townshipFilter = document.querySelector("#township-filter");
const typeFilter = document.querySelector("#type-filter");
const severityFilter = document.querySelector("#severity-filter");
const reportsList = document.querySelector("#reports-list");
const resultsCount = document.querySelector("#results-count");
const uniqueSorted = values => [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));

function setOptions(select, values, defaultText) {
    select.innerHTML = `<option value="">${defaultText}</option>`;
    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function formatDate(value) {
    return new Intl.DateTimeFormat("es-PA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function renderReports(data) {
    resultsCount.textContent = `${data.length} ${data.length === 1 ? "resultado" : "resultados"}`;
    if (!data.length) {
        reportsList.innerHTML = `<div class="empty-state"><h3>No encontramos coincidencias</h3><p>Prueba con una ubicación o clasificación diferente.</p><button class="button button-secondary" type="button" id="empty-clear">Limpiar filtros</button></div>`;
        document.querySelector("#empty-clear").addEventListener("click", resetFilters);
        return;
    }
    reportsList.innerHTML = data.map(item => `
        <article class="report-card">
            <div>
                <div class="report-topline"><h3>${item.type}</h3><span class="severity ${item.severity.toLowerCase()}">Gravedad ${item.severity.toLowerCase()}</span><span class="status">Pendiente de verificación</span></div>
                <p class="report-location">${item.township}, ${item.district}, ${item.province}</p>
                <p class="report-description">${item.description}</p>
                <div class="report-meta"><span>${item.affected} ${item.affected === 1 ? "persona afectada" : "personas afectadas"}</span><span>${item.assistance ? "Solicita asistencia" : "No solicita asistencia"}</span></div>
            </div>
            <time class="report-date" datetime="${item.date}">${formatDate(item.date)}</time>
        </article>`).join("");
}

function applyFilters() {
    renderReports(incidents.filter(item =>
        (!provinceFilter.value || item.province === provinceFilter.value) &&
        (!districtFilter.value || item.district === districtFilter.value) &&
        (!townshipFilter.value || item.township === townshipFilter.value) &&
        (!typeFilter.value || item.type === typeFilter.value) &&
        (!severityFilter.value || item.severity === severityFilter.value)
    ));
}

function updateDistricts() {
    const matching = incidents.filter(item => !provinceFilter.value || item.province === provinceFilter.value);
    setOptions(districtFilter, uniqueSorted(matching.map(item => item.district)), "Todos los distritos");
    districtFilter.disabled = !provinceFilter.value;
    townshipFilter.disabled = true;
    setOptions(townshipFilter, [], "Todos los corregimientos");
    applyFilters();
}

function updateTownships() {
    const matching = incidents.filter(item => item.province === provinceFilter.value && (!districtFilter.value || item.district === districtFilter.value));
    setOptions(townshipFilter, uniqueSorted(matching.map(item => item.township)), "Todos los corregimientos");
    townshipFilter.disabled = !districtFilter.value;
    applyFilters();
}

function resetFilters() {
    provinceFilter.value = "";
    typeFilter.value = "";
    severityFilter.value = "";
    districtFilter.disabled = true;
    townshipFilter.disabled = true;
    setOptions(districtFilter, [], "Todos los distritos");
    setOptions(townshipFilter, [], "Todos los corregimientos");
    renderReports(incidents);
}

function renderSummary() {
    document.querySelector("#total-count").textContent = incidents.length;
    document.querySelector("#earthquake-count").textContent = incidents.filter(item => item.type === "Terremoto").length;
    document.querySelector("#landslide-count").textContent = incidents.filter(item => item.type === "Deslizamiento").length;
    document.querySelector("#assistance-count").textContent = incidents.filter(item => item.assistance).length;
    const counts = incidents.reduce((result, item) => { result[item.province] = (result[item.province] || 0) + 1; return result; }, {});
    const maxCount = Math.max(...Object.values(counts));
    document.querySelector("#province-coverage").innerHTML = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, "es")).map(([province, count]) => {
        const level = count === maxCount ? 3 : count > 1 ? 2 : 1;
        return `<div class="province-chip" data-level="${level}"><span>${province}</span><strong>${count}</strong></div>`;
    }).join("");
}

setOptions(provinceFilter, uniqueSorted(incidents.map(item => item.province)), "Todas las provincias");
provinceFilter.addEventListener("change", updateDistricts);
districtFilter.addEventListener("change", updateTownships);
townshipFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);
severityFilter.addEventListener("change", applyFilters);
filtersForm.addEventListener("reset", () => window.setTimeout(resetFilters, 0));
renderSummary();
renderReports(incidents);
