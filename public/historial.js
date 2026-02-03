const nodoSel = document.getElementById("nodo");
const fechaIn = document.getElementById("fecha");

const desdeHoraSel = document.getElementById("desdeHora");
const desdeMinSel  = document.getElementById("desdeMin");
const hastaHoraSel = document.getElementById("hastaHora");
const hastaMinSel  = document.getElementById("hastaMin");

const btn = document.getElementById("cargar");
const ctx = document.getElementById("grafica").getContext("2d");

let chart = null;

// ===============================
// CARGAR NODOS
// ===============================
fetch("/api/nodos")
  .then(r => r.json())
  .then(nodos => {
    nodoSel.innerHTML = `<option value="">-- Selecciona --</option>`;
    nodos.forEach(n => {
      nodoSel.innerHTML += `<option value="${n}">${n}</option>`;
    });
  });

// ===============================
// HORAS Y MINUTOS (24H REAL)
// ===============================
for (let h = 0; h < 24; h++) {
  const v = h.toString().padStart(2, "0");
  desdeHoraSel.innerHTML += `<option value="${v}">${v}</option>`;
  hastaHoraSel.innerHTML += `<option value="${v}">${v}</option>`;
}

for (let m = 0; m < 60; m++) {
  const v = m.toString().padStart(2, "0");
  desdeMinSel.innerHTML += `<option value="${v}">${v}</option>`;
  hastaMinSel.innerHTML += `<option value="${v}">${v}</option>`;
}

// Valores por defecto
desdeHoraSel.value = "00";
desdeMinSel.value  = "00";
hastaHoraSel.value = "23";
hastaMinSel.value  = "59";

// ===============================
// UTIL: YYYY-MM-DD → DD/MM/YYYY
// ===============================
function convertirFecha(fechaISO) {
  const [y, m, d] = fechaISO.split("-");
  return `${d}/${m}/${y}`;
}

// ===============================
// BOTÓN CARGAR
// ===============================
btn.addEventListener("click", async () => {

  const nodo = nodoSel.value;
  const fechaISO = fechaIn.value;

  if (!nodo || !fechaISO) {
    alert("Selecciona nodo y fecha");
    return;
  }

  const fecha = convertirFecha(fechaISO);

  const desdeHora = `${desdeHoraSel.value}:${desdeMinSel.value}`;
  const hastaHora = `${hastaHoraSel.value}:${hastaMinSel.value}`;

  const params = new URLSearchParams({
    nodo,
    fecha,
    desdeHora,
    hastaHora
  });

  const res = await fetch(`/api/historial?${params}`);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    alert("No hay datos para ese rango");
    return;
  }

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.hora),
      datasets: [
        { label: "Temp (°C)", data: data.map(d => d.Temp), borderColor: "#ff4d4d", tension: 0.3 },
        { label: "pH",        data: data.map(d => d.pH),   borderColor: "#4da6ff", tension: 0.3 },
        { label: "EC",        data: data.map(d => d.EC),   borderColor: "#ffd24d", tension: 0.3 },
        { label: "DO",        data: data.map(d => d.DO),   borderColor: "#4dffff", tension: 0.3 },
        { label: "Bat (V)",   data: data.map(d => d.Bat),  borderColor: "#b366ff", tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#eee" } }
      },
      scales: {
        x: { ticks: { color: "#eee" }, grid: { color: "#333" } },
        y: { ticks: { color: "#eee" }, grid: { color: "#333" } }
      }
    }
  });
});
