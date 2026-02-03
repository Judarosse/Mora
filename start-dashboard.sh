#!/bin/bash

# Espera un momento por si el server aún no ha arrancado
sleep 5

# Iniciar ngrok con dominio personalizado
ngrok http --domain=wolf-decent-turkey.ngrok-free.app 3000
