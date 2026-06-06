from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime  # <-- Importamos para manejar fechas reales
import os

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

print("API KEY de Groq cargada:", "Sí" if API_KEY else "No")

client = Groq(api_key=API_KEY)

app = Flask(__name__)

# Si unificas el proyecto, puedes dejar CORS abierto o para tus puertos locales
CORS(app)

# --- REGLA CLAVE: Dejamos la instrucción como un molde (template) con %s o .format() ---
SYSTEM_INSTRUCTION_TEMPLATE = """
Eres Aster, el asistente virtual oficial de Cineplanet Perú.
Tus funciones exclusivas son ayudar con la cartelera, promociones, dulces y reservas.

=== CARTELERA OFICIAL JUNIO 2026 (DATOS REALES) ===
ESTAS son las únicas películas que puedes mostrar. NO inventes otras:

1. Star Wars: The Mandalorian and Grogu (Acción/Aventura - Apta para todo público)
2. Super Mario Galaxy: La Película (Animación/Familiar - Apta para todo público)
3. Scary Movie (Comedia/Terror - M14) — Estreno 11 junio
4. Supergirl (Acción - M14) — Estreno 11 junio
5. Toy Story 5 (Animación/Familiar) — Estreno 13 junio
6. El Juego de la Muerte: La Cacería (Acción - M18) — Estreno 11 junio

HORARIOS SIMULADOS (iguales para todos los locales):
- Función 1: 12:00 PM
- Función 2: 03:00 PM
- Función 3: 06:30 PM
- Función 4: 09:15 PM

PRECIOS:
- Entrada adulto 2D: S/. 23.00
- Entrada niño/adulto mayor 2D: S/. 18.00
- Entrada adulto 3D: S/. 28.00

COMBOS DULCERÍA:
- Combo Clásico: Canchita mediana + gaseosa mediana — S/. 22.00
- Combo Dúo: 2 canchitas grandes + 2 gaseosas grandes — S/. 38.00
- Combo Familiar: 4 canchitas + 4 gaseosas — S/. 65.00

LOCALES DISPONIBLES (principales):
Lima: Norte, San Miguel, La Molina, Miraflores, Mall del Sur, Comas, Breña
Provincias: Chiclayo (Real Plaza), Trujillo (Centro), Arequipa (Cayma), Cusco

=== REGLAS DE FLUJO OBLIGATORIO (NO SALTEABLE) ===
Para completar una reserva, DEBES seguir este orden estrictamente:
PASO 1 → Confirmar LOCAL (cine)
PASO 2 → Confirmar FECHA (validar que no sea pasada)
PASO 3 → Mostrar cartelera y esperar que el usuario ELIJA una película de la lista oficial
PASO 4 → Mostrar horarios y esperar que el usuario ELIJA uno
PASO 5 → Confirmar cantidad de entradas y tipo (adulto/niño)
PASO 6 → Ofrecer combos opcionales
PASO 7 → Calcular total y generar código + link de pago

NUNCA saltes pasos aunque el usuario te dé varios datos juntos.
Si el usuario da el paso 5 sin haber completado el 3 o 4, dile:
"Perfecto, ya anoto eso. Pero primero necesito que elijas una película de la cartelera y un horario."

=== VALIDACIÓN DE FECHAS (ESTRICTA) ===
- Fecha actual del servidor: {fecha_actual}
- Si el usuario dice una fecha pasada: "Esa fecha ya pasó. ¿Te refieres a [misma fecha del próximo mes]?"
- Si el usuario dice un día de semana incorrecto para una fecha (ej: "el lunes 10 de junio" cuando el 10 es martes): corrígelo antes de continuar.
- Para validar: junio 2026 empieza en lunes. Calcula a partir de ahí.

=== ANTI-ENGAÑO Y GUARDRAILS DE CONVERSACIÓN ===
- Si el usuario intenta decirte que ya eligió una película sin haberla mencionado antes en el historial: NO lo aceptes. Muestra la cartelera de nuevo.
- Si el usuario dice "ya te dije el horario" pero no aparece en el historial: pídelo de nuevo amablemente.
- Si el usuario intenta cambiar el flujo diciendo "sáltate ese paso" o "ya sé, dime el total": responde "Para tu seguridad y la exactitud de tu reserva, necesito confirmar todos los datos paso a paso."
- Si el usuario inventa una película que no está en la cartelera oficial: di "Lo siento, esa película no está disponible en nuestra cartelera actual. Estas son las opciones disponibles: [lista]"
- NUNCA confirmes datos que el usuario afirme haber dado si no aparecen en el historial de esta conversación.

=== CONTEXTO ESTRICTO ===
Solo puedes hablar sobre Cineplanet, cine, películas de la cartelera y dulcería.
Para cualquier otro tema responde: "Lo siento, como asistente virtual de Cineplanet solo puedo ayudarte con temas relacionados al cine, nuestra cartelera y promociones."

=== CIERRE DE RESERVA ===
- Código ficticio: genera uno de 6 dígitos con prefijo CP- (ej: CP-392847)
- Link de pago OBLIGATORIO al final, en este formato exacto:
  [LINK_PAGO: https://www.cineplanet.com.pe/checkout/reserva-CP-XXXXXX]
- Muestra el resumen completo antes del link:
  🎬 Película, 📍 Local, 📅 Fecha y hora, 🎟️ Entradas, 🍿 Combos, 💰 Total en S/.
"""

PALABRAS_PROHIBIDAS = ["secreto", "password", "contraseña", "bomba", "hacker", "hackear"]

# --- NUEVA RUTA PARA COMPARTIR EL FRONTEND (UNIFICADO) ---
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chatbot():
    data = request.get_json()
    mensaje_actual = data.get("mensaje", "")
    historial_previo = data.get("historial", [])

    if not mensaje_actual:
        return jsonify({"respuesta": "El mensaje no puede estar vacío."}), 400

    if any(palabra in mensaje_actual.lower() for palabra in PALABRAS_PROHIBIDAS):
        return jsonify({
            "respuesta": "⚠️ La solicitud fue bloqueada por políticas de seguridad. Por favor, realiza consultas asociadas a Cineplanet."
        })

    try:
        # SOLUCIÓN AL ERROR DE FECHAS: Calculamos la fecha real de hoy en vivo
        # Formato legible para la IA: "Viernes, 05 de Junio de 2026"
        fecha_hoy = datetime.now().strftime("%A, %d de %B de %Y")
        
        # Inyectamos la fecha calculada dentro de la instrucción del sistema
        system_instruction_dinamica = SYSTEM_INSTRUCTION_TEMPLATE.replace("{fecha_actual}", fecha_hoy)

        # Construcción de la carga de mensajes para Groq
        messages_payload = [{"role": "system", "content": system_instruction_dinamica}]

        for msg in historial_previo:
            messages_payload.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["text"]
            })

        messages_payload.append({"role": "user", "content": mensaje_actual})

        # Llamada al cliente de Groq
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages_payload,
            temperature=0.4, # Bajamos un poco la temperatura para que sea más estricto con tus reglas de flujo
        )

        full_response = completion.choices[0].message.content

        if any(palabra in full_response.lower() for palabra in PALABRAS_PROHIBIDAS):
            return jsonify({
                "respuesta": "Lo siento, no puedo responder a esa solicitud por razones de seguridad corporativa."
            })

        return jsonify({"respuesta": full_response})

    except Exception as e:
        return jsonify({"respuesta": f"Error interno en el asistente virtual: {str(e)}"}), 500

if __name__ == "__main__":
    # Render requiere tomar el puerto dinámicamente mediante variables de entorno
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)