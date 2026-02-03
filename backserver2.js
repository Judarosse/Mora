// === IMPORTS ===
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// === CONFIGURACIÓN ===
const SERIAL_PORT = '/dev/ttyAMA0';
const BAUD_RATE = 115200;

const MQTT_BROKER = 'mqtt://localhost';
const MQTT_TOPIC = 'sensores/datos';

const LOG_PATH = path.join(__dirname, 'datos_sensores.txt');
const SEPARADOR = '----------------------';
const INTERVALO_GUARDADO_MS = 1 * 60 * 1000; // 1 minuto

// === ASEGURAR ENCABEZADO ===
function asegurarEncabezados() {
  const encabezado =
    "Fecha; Hora; Nodo; Bat; Temp; pH; EC; DO; Lat; Lon; Sat\n";

  try {
    if (!fs.existsSync(LOG_PATH)) {
      fs.writeFileSync(LOG_PATH, encabezado, { flag: 'w' });
      return;
    }

    const contenido = fs.readFileSync(LOG_PATH, 'utf8');
    if (!contenido.startsWith("Fecha;")) {
      fs.writeFileSync(LOG_PATH, encabezado + contenido, { flag: 'w' });
    }
  } catch (err) {
    console.error("❌ Error al asegurar encabezados:", err.message);
  }
}

// Ejecutar apenas arranca
asegurarEncabezados();

// === SERVIDOR WEB ===
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.get('/descargar', (req, res) => res.download(LOG_PATH));

// === HISTORIAL HTML ===
app.get('/historial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'historial.html'));
});

// =========================================================
// 📌 API NODOS — lee nodos reales del archivo
// =========================================================
app.get("/api/nodos", (req, res) => {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return res.json([]);
    }

    const contenido = fs.readFileSync(LOG_PATH, "utf8");
    const lineas = contenido.split("\n").slice(1);

    const nodos = new Set();

    for (const l of lineas) {
      if (!l.trim()) continue;
      const c = l.split(";").map(x => x.trim());
      if (c[2]) nodos.add(c[2]);
    }

    res.json([...nodos].sort());

  } catch (err) {
    console.error("❌ Error leyendo nodos:", err.message);
    res.status(500).json([]);
  }
});

// =========================================================
// 🔥 API HISTORIAL — VERSION CORREGIDA
// =========================================================
app.get('/api/historial', (req, res) => {
  const { nodo, fecha, desdeHora, hastaHora } = req.query;
  if (!nodo || !fecha) return res.json([]);

  const desde = desdeHora || "00:00";
  const hasta = hastaHora || "23:59";

  const [dh, dm] = desde.split(":").map(Number);
  const [hh, hm] = hasta.split(":").map(Number);

  const desdeMin = dh * 60 + dm;
  const hastaMin = hh * 60 + hm;

  const resultados = [];

  try {
    const contenido = fs.readFileSync(LOG_PATH, "utf8");
    const lineas = contenido.split("\n").slice(1);

    for (const l of lineas) {
      if (!l.trim()) continue;

      const c = l.split(";").map(x => x.trim());

      // Fecha y nodo exactos
      if (c[0] !== fecha) continue;
      if (c[2] !== nodo) continue;

      // === PARSE HORA SEGURO ===
      let horaTxt = c[1];

      // quitar AM/PM, p. m., a. m.
      horaTxt = horaTxt
        .replace(/a\.?\s?m\.?/i, "")
        .replace(/p\.?\s?m\.?/i, "")
        .trim();

      const partes = horaTxt.split(":").map(Number);
      if (partes.length < 2) continue;

      let h = partes[0];
      let m = partes[1];

      const minDia = h * 60 + m;
      if (minDia < desdeMin || minDia > hastaMin) continue;

      resultados.push({
        hora: c[1],
        Bat: parseFloat(c[3]?.replace("Bat=", "")) || null,
        Temp: parseFloat(c[4]?.replace("Tmp=", "")) || null,
        pH: parseFloat(c[5]?.replace("pH=", "")) || null,
        EC: parseFloat(c[6]?.replace("EC=", "")) || null,
        DO: parseFloat(c[7]?.replace("DO=", "")) || null
      });
    }

    res.json(resultados);

  } catch (err) {
    console.error("Historial error:", err.message);
    res.json([]);
  }
});

// === MQTT ===
const mqttClient = mqtt.connect(MQTT_BROKER);

// === SERIAL ===
const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

console.log(`📡 UART abierto en ${SERIAL_PORT} @ ${BAUD_RATE}`);

let buffer = '';
let ultimoPorNodo = {};
let ultimosDatosParaGuardar = {};

// === UTILIDADES ===
function limpiarNodo(n) {
  if (!n) return null;
  let limpio = n.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = limpio.match(/(\d+)/);
  if (!match) return null;
  return "NODE" + match[1];
}

function porcentajeBateria(v) {
  if (!v || isNaN(v)) return null;
  const x = Number(v);
  if (x >= 4.20) return 100;
  if (x >= 4.10) return 90;
  if (x >= 4.00) return 80;
  if (x >= 3.85) return 60;
  if (x >= 3.70) return 40;
  if (x >= 3.50) return 20;
  if (x >= 3.30) return 10;
  return 5;
}

function safeAppendSync(file, line) {
  try {
    fs.appendFileSync(file, line);
  } catch (err) {
    console.error('❌ Error guardando archivo:', err.message);
  }
}

// === LECTURA SERIAL ===
parser.on('data', (line) => {
  line = line.trim();
  if (!line) return;

  buffer += line + '\n';

  if (line.includes(SEPARADOR)) {
    const mensajeCompleto = buffer.trim();

    const tieneMsg =
      mensajeCompleto.includes("Msg=") &&
      !mensajeCompleto.match(/Msg=\s*$/m);

    if (tieneMsg) {
      mqttClient.publish(MQTT_TOPIC, mensajeCompleto);
      console.log('📤 Publicado por MQTT:\n', mensajeCompleto);
    } else {
      console.log("⚠️ Mensaje ignorado: Msg vacío");
    }

    buffer = '';
  }
});

// === MQTT ===
mqttClient.on('connect', () => {
  console.log('✅ MQTT conectado');
  mqttClient.subscribe(MQTT_TOPIC);
});

mqttClient.on('message', (topic, message) => {
  const texto = message.toString();
  const datos = parsearTexto(texto);

  datos.forEach(d => {
    if (!d.node) return;

    const last = ultimoPorNodo[d.node] || {};

    if (d.Bat === null) d.Bat = last.Bat ?? null;
    d.BatPercent = porcentajeBateria(d.Bat);

    if (d.Temp === null) d.Temp = last.Temp ?? null;
    if (d.pH === null) d.pH = last.pH ?? null;
    if (d.EC === null) d.EC = last.EC ?? null;
    if (d.DO === null) d.DO = last.DO ?? null;

    d.timestamp = new Date().toLocaleString("es-CO", {
      hour12: true,
      hour: "numeric",
      minute: "numeric",
      month: "numeric",
      day: "numeric",
      year: "numeric"
    });

    ultimoPorNodo[d.node] = d;
    ultimosDatosParaGuardar[d.node] = d;

    io.emit("sensorData", d);
  });
});

// === PARSEADOR ===
function parsearTexto(texto) {
  const bloques = texto.split(/Nodo:/).filter(Boolean);
  const resultados = [];

  for (let bloque of bloques) {
    const [lineaNodo, ...resto] = bloque.trim().split('\n');
    const nodo = limpiarNodo(lineaNodo.trim());
    if (!nodo) continue;

    const lineaDatos = resto.find(l => l.includes("Datos:"));
    if (!lineaDatos) continue;

    const msg = (lineaDatos.match(/Msg=(.*)/) || [])[1] || "";
    if (!msg.trim()) continue;

    const lat = parseFloat((lineaDatos.match(/Lat=([\d.\-]+)/) || [])[1]) || 0;
    const lon = parseFloat((lineaDatos.match(/Lon=([\d.\-]+)/) || [])[1]) || 0;
    const sat = parseInt((lineaDatos.match(/Sat=(\d+)/) || [])[1]) || 0;

    let Bat = parseFloat((msg.match(/Bat:\s*([\d.]+)/i) || [])[1]);
    if (isNaN(Bat) || Bat === 0) Bat = null;

    const temp = parseFloat((msg.match(/Temp:\s*([\d.]+)/i) || [])[1]);
    const pH = parseFloat((msg.match(/pH:\s*([\d.]+)/i) || [])[1]);
    const EC = parseFloat((msg.match(/EC:\s*([\d.]+)/i) || [])[1]);
    const DO = parseFloat((msg.match(/DO:\s*([\d.]+)/i) || [])[1]);

    resultados.push({
      node: nodo,
      Bat: isNaN(Bat) ? null : Bat,
      Temp: isNaN(temp) ? null : temp,
      pH: isNaN(pH) ? null : pH,
      EC: isNaN(EC) ? null : EC,
      DO: isNaN(DO) ? null : DO,
      Lat: lat,
      Lon: lon,
      Sat: sat
    });
  }

  return resultados;
}

// === GUARDADO CADA 1 MIN ===
setInterval(() => {

  if (!fs.existsSync(LOG_PATH) || fs.readFileSync(LOG_PATH, "utf8").trim() === "") {
    const encabezado =
      "Fecha; Hora; Nodo; Bat; Temp; pH; EC; DO; Lat; Lon; Sat\n";
    safeAppendSync(LOG_PATH, encabezado);
    console.log("📌 Encabezado agregado al archivo.");
  }

  const now = new Date();
  const fecha = now.toLocaleDateString("es-CO");
  const hora = now.toLocaleTimeString("es-CO", {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit"
});

  for (const nodo in ultimosDatosParaGuardar) {
    const d = ultimosDatosParaGuardar[nodo];
    if (!d) continue;

    const linea =
      `${fecha}; ${hora}; ${nodo}; ` +
      `Bat=${d.Bat ?? ""}; ` +
      `Tmp=${d.Temp ?? ""}; ` +
      `pH=${d.pH ?? ""}; ` +
      `EC=${d.EC ?? ""}; ` +
      `DO=${d.DO ?? ""}; ` +
      `Lat=${d.Lat}; ` +
      `Lon=${d.Lon}; ` +
      `Sat=${d.Sat}\n`;

    safeAppendSync(LOG_PATH, linea);
    console.log(`📝 Guardado → ${nodo}`);
  }

  ultimosDatosParaGuardar = {};

}, INTERVALO_GUARDADO_MS);

// === SOCKET.IO ===
io.on('connection', socket => {
  console.log("🔌 Cliente conectado");
  Object.values(ultimoPorNodo).forEach(d => socket.emit("sensorData", d));
});

// === SERVIDOR ===
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Dashboard en http://localhost:${PORT}`);
});
