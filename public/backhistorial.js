const nodoSel = document.getElementById("nodo");
const fechaIn = document.getElementById("fecha");
const desdeIn = document.getElementById("desde");
const hastaIn = document.getElementById("hasta");
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

  const params = new URLSearchParams({
    nodo,
    fecha,
    desdeHora: desdeIn.value || "00:00",
    hastaHora: hastaIn.value || "23:59"
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
        {
          label: "Temp (°C)",
          data: data.map(d => d.Temp),
          borderColor: "#ff4d4d",
          tension: 0.3
        },
        {
          label: "pH",
          data: data.map(d => d.pH),
          borderColor: "#4da6ff",
          tension: 0.3
        },
        {
          label: "EC",
          data: data.map(d => d.EC),
          borderColor: "#ffd24d",
          tension: 0.3
        },
        {
          label: "DO",
          data: data.map(d => d.DO),
          borderColor: "#4dffff",
          tension: 0.3
        },
        {
          label: "Batería (V)",
          data: data.map(d => d.Bat),
          borderColor: "#b366ff",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#eee" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#eee" },
          grid: { color: "#333" }
        },
        y: {
          ticks: { color: "#eee" },
          grid: { color: "#333" }
        }
      }
    }
  });
});
