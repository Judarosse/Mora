// =======================================================
// Conexión Socket.IO
// =======================================================
const socket = io();

// Elementos del DOM
const menuNodos = document.getElementById('menuNodos');
const tituloNodo = document.getElementById('tituloNodo');
const dashboard = document.getElementById('dashboard');

const tempValue = document.getElementById('tempValue');
const phValue = document.getElementById('phValue');
const ecValue = document.getElementById('ecValue');
const doValue = document.getElementById('doValue');

const latEl = document.getElementById('latitud');
const lonEl = document.getElementById('longitud');
const satEl = document.getElementById('satelites');

const batteryBar = document.getElementById('batteryBar');
const batText = document.getElementById('batText');

const horaActualEl = document.getElementById("horaActual");
const horaUltimaEl = document.getElementById("ultimaActualizacion");

let nodes = {}; 
let selectedNode = null;

// =======================================================
// RELOJ EN TIEMPO REAL
// =======================================================
setInterval(() => {
  horaActualEl.textContent = new Date().toLocaleString("es-CO", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour12: true,
      hour: "numeric",
      minute: "numeric"
  });
}, 1000);

// =======================================================
// Crear gauges
// =======================================================
const opts = {
  angle: 0,
  lineWidth: 0.4,
  radiusScale: 1,
  pointer: {
    length: 0.6,
    strokeWidth: 0.035,
    color: '#000'
  },
  limitMax: false,
  limitMin: false,
  staticLabels: { font: "10px sans-serif", labels: [], color: "#fff", fractionDigits: 0 },
  colorStart: '#6FADCF',
  colorStop: '#8FC0DA',
  strokeColor: '#E0E0E0',
  generateGradient: true,
  highDpiSupport: true
};

const gTemp = new Gauge(document.getElementById('gaugeTemp')).setOptions(opts);
gTemp.maxValue = 50; gTemp.setMinValue(0); gTemp.animationSpeed = 20;

const gPH = new Gauge(document.getElementById('gaugePH')).setOptions(opts);
gPH.maxValue = 14; gPH.setMinValue(0); gPH.animationSpeed = 20;

const gEC = new Gauge(document.getElementById('gaugeEC')).setOptions(opts);
gEC.maxValue = 20000; gEC.setMinValue(0); gEC.animationSpeed = 20;

const gDO = new Gauge(document.getElementById('gaugeDO')).setOptions(opts);
gDO.maxValue = 20; gDO.setMinValue(0); gDO.animationSpeed = 20;

// =======================================================
// Socket: recibir datos
// =======================================================
socket.on('sensorData', (data) => {
  nodes[data.node] = data;

  refreshMenu();

  if (!selectedNode) {
    selectNode(data.node);
  } else if (selectedNode === data.node) {
    renderNode(data);
  }
});

// =======================================================
// Menú dinámico nodos
// =======================================================
function refreshMenu() {
  menuNodos.innerHTML = '';
  Object.keys(nodes).forEach(n => {
    const li = document.createElement('li');
    li.textContent = n;
    li.className = (n === selectedNode) ? 'active' : '';
    li.addEventListener('click', () => selectNode(n));
    menuNodos.appendChild(li);
  });
}

function selectNode(node) {
  selectedNode = node;
  tituloNodo.textContent = `Nodo: ${node}`;
  refreshMenu();
  dashboard.classList.remove('hidden');

  const data = nodes[node];
  if (data) renderNode(data);
}

// =======================================================
// Render principal del nodo
// =======================================================
function renderNode(data) {

  // ===== TEMPERATURA =====
  const t = !isNaN(data.Temp) ? data.Temp : null;
  if (t !== null) { gTemp.set(t); tempValue.textContent = `${t} °C`; }
  else tempValue.textContent = "-- °C";

  // ===== PH =====
  const ph = !isNaN(data.pH) ? data.pH : null;
  if (ph !== null) { gPH.set(ph); phValue.textContent = ph; }
  else phValue.textContent = "--";

  // ===== EC =====
  const ec = !isNaN(data.EC) ? data.EC : null;
  if (ec !== null) { gEC.set(ec); ecValue.textContent = `${ec} µS/cm`; }
  else ecValue.textContent = "-- µS/cm";

  // ===== DO =====
  const dov = !isNaN(data.DO) ? data.DO : null;
  if (dov !== null) { gDO.set(dov); doValue.textContent = `${dov} mg/L`; }
  else doValue.textContent = "-- mg/L";

  // ===== GPS =====
  if (data.Lat || data.Lon || data.Sat) {
    document.getElementById('ubicacion').classList.remove('hidden');
    latEl.textContent = data.Lat;
    lonEl.textContent = data.Lon;
    satEl.textContent = data.Sat;
  } else {
    document.getElementById('ubicacion').classList.add('hidden');
  }

  // ===== BATERÍA =====
  const bat = (!isNaN(data.Bat)) ? Number(data.Bat) : null;
  const pct = (!isNaN(data.BatPercent)) ? Number(data.BatPercent) : null;

  if (pct !== null) {
    batteryBar.style.width = `${pct}%`;

    batteryBar.classList.remove('battery-high','battery-medium','battery-low');
    if (pct >= 70) batteryBar.classList.add('battery-high');
    else if (pct >= 30) batteryBar.classList.add('battery-medium');
    else batteryBar.classList.add('battery-low');

    batText.textContent = `${bat.toFixed(2)} V (${pct}%)`;
  } else {
    // No borrar si no llegó dato nuevo
    if (bat !== null) {
      batText.textContent = `${bat.toFixed(2)} V (--%)`;
    }
  }

  // ===== HORA DE ÚLTIMA ACTUALIZACIÓN =====
  if (data.timestamp && data.timestamp !== horaUltimaEl.textContent) {
    horaUltimaEl.textContent = data.timestamp;
  }
}

// =======================================================
// Descargar archivo
// =======================================================
function descargar() {
  window.location.href = '/descargar';
}
