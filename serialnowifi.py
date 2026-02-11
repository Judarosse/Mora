import serial
import re
from datetime import datetime
import time

PORT = "/dev/ttyAMA0"
BAUD = 115200
OUTPUT_FILE = "datos_offline.txt"

def conectar_serial():
    while True:
        try:
            ser = serial.Serial(PORT, BAUD, timeout=1)
            print("Puerto conectado.")
            return ser
        except:
            print("Esperando puerto serial...")
            time.sleep(2)

ser = conectar_serial()

print("Logger iniciado...")

current_node = "UNKNOWN"

with open(OUTPUT_FILE, "a") as f:

    while True:
        try:
            raw = ser.readline().decode("utf-8", errors="ignore").strip()

            if not raw:
                continue

            # Capturar nodo
            if raw.startswith("Nodo:"):
                current_node = raw.split("Nodo:")[1].strip()
                continue

            if not raw.startswith("Datos:"):
                continue

            # Limpiar caracteres raros
            raw = re.sub(r"[^\x20-\x7E°.,:=()/\- ]", "", raw)

            # Extraer GPS (opcionales)
            lat = re.search(r"Lat=([-]?\d+\.\d+)", raw)
            lon = re.search(r"Lon=([-]?\d+\.\d+)", raw)
            sat = re.search(r"Sat=(\d+)", raw)

            msg_match = re.search(r"Msg=(.*)", raw)
            if not msg_match:
                continue

            msg = msg_match.group(1)

            # Extraer sensores
            bat = re.search(r"Bat:\s*(\d+\.\d+)", msg)
            temp = re.search(r"Temp[:\s]*(\d+\.\d+)", msg)
            ph = re.search(r"pH[:\s]*(\d+\.\d+)", msg)
            ec = re.search(r"EC[:\s]*(\d+\.\d+)", msg)
            do = re.search(r"DO[:\s]*(\d+\.\d+)", msg)

            # 🔒 Validación real: Temp obligatorio + (pH o DO)
            if not temp:
                continue

            if not (ph or do):
                continue

            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            linea = (
                f"{timestamp}; "
                f"Nodo: {current_node}; "
                f"Lat: {lat.group(1) if lat else ''}; "
                f"Lon: {lon.group(1) if lon else ''}; "
                f"Sat: {sat.group(1) if sat else ''}; "
                f"Bat: {bat.group(1) if bat else ''}; "
                f"Temp: {temp.group(1)}; "
                f"pH: {ph.group(1) if ph else ''}; "
                f"EC: {ec.group(1) if ec else ''}; "
                f"DO: {do.group(1) if do else ''}\n"
            )

            print(linea.strip())
            f.write(linea)
            f.flush()

        except serial.SerialException:
            print("Puerto desconectado. Reintentando...")
            ser.close()
            time.sleep(2)
            ser = conectar_serial()

        except KeyboardInterrupt:
            print("\nCerrando logger.")
            ser.close()
            break

        except:
            time.sleep(0.1)
