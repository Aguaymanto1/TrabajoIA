const messages = document.getElementById("messages");

// --- MEMORIA CONVERSACIONAL (Semana 2) ---
let chatHistory = [];

// --- 1. FUNCIÓN CORREGIDA PARA EL DISEÑO MODERNO (REEMPLAZA LA TUYA) ---
function addMessage(role, text) {
    // Creamos la fila contenedora del mensaje
    const row = document.createElement("div");
    row.className = `msg-row ${role}`; // Agrega 'msg-row user' o 'msg-row bot'

    // Creamos el avatar correspondiente
    const avatar = document.createElement("div");
    if (role === "user") {
        avatar.className = "msg-avatar user-av";
        avatar.innerText = "👤"; 
    } else {
        avatar.className = "msg-avatar bot-av";
        avatar.innerText = "🎬"; 
    }

    // Creamos la burbuja con el estilo CSS
    const bubble = document.createElement("div");
    bubble.className = `bubble ${role}`;
    bubble.innerText = text;

    // Armamos la estructura
    row.appendChild(avatar);
    row.appendChild(bubble);
    messages.appendChild(row);
    
    messages.scrollTop = messages.scrollHeight;

    if (
        text !== "Hola, soy Aster. ¿En qué puedo ayudarte?" &&
        !text.includes("⏳") &&
        !text.includes("⚠️") &&
        !text.includes("Error") &&
        !text.includes("🌐")
    ) {
        chatHistory.push({ role: role, text: text });
    }
}

// --- 2. ENVIAR MENSAJE (CON LA SOLUCIÓN RELATIVA "/chat" SI UNIFICASTE) ---
async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();

    if (!text) return;

    addMessage("user", text);
    input.value = "";
    
    // AQUÍ: Reseteamos la altura del textarea cuando el usuario envía el texto
    input.style.height = "auto"; 

    try {
        // NOTA: Si unificaste el proyecto en Flask, usa "/chat". 
        // Si mantienes servidores separados usa "https://tu-backend.onrender.com/chat"
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mensaje: text,
                historial: chatHistory
            })
        });

        const data = await response.json();

        if (data.respuesta && (data.respuesta.includes("Error interno") || data.respuesta.includes("429 RESOURCE_EXHAUSTED"))) {
            chatHistory.pop(); 
            addMessage("bot", "⏳ Ups, estoy recibiendo muchas solicitudes en este momento. Por favor, espera unos segundos y vuelve a escribir tu mensaje para continuar con tu reserva.");
            return;
        }

        if (data.respuesta && data.respuesta.includes("[LINK_PAGO:")) {
            const regex = /\[LINK_PAGO:\s*(https?:\/\/[^\]]+)\]/;
            const match = data.respuesta.match(regex);
            const textoLimpio = data.respuesta.replace(regex, "").trim();
            
            addMessage("bot", textoLimpio);

            if (match && match[1]) {
                const urlPago = match[1];
                const btnContenedor = document.createElement("div");
                btnContenedor.style.marginTop = "10px";

                const botonPago = document.createElement("button");
                botonPago.innerText = "💳 Proceder al Pago Seguro";
                botonPago.style.background = "#e6005c"; 
                botonPago.style.color = "white";
                botonPago.style.border = "none";
                botonPago.style.padding = "8px 15px";
                botonPago.style.borderRadius = "20px";
                botonPago.style.cursor = "pointer";
                botonPago.style.fontWeight = "bold";
                botonPago.style.width = "100%";

                botonPago.addEventListener("click", () => {
                    alert(`🛒 Simulando pasarela de pago Cineplanet...\nRedireccionando de forma segura a:\n${urlPago}\n\n¡Reserva completada exitosamente!`);
                });

                btnContenedor.appendChild(botonPago);
                messages.appendChild(btnContenedor);
                messages.scrollTop = messages.scrollHeight;
            }
            return;
        }

        addMessage("bot", data.respuesta);

    } catch (error) {
        console.error("Error de comunicación:", error);
        chatHistory.pop();
        addMessage("bot", "🌐 Lo siento, tuve un problema de conexión con el sistema central. Por favor, inténtalo de nuevo en unos instantes.");
    }
}

// --- CONFIGURACIÓN DE EVENTOS ---
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault(); // Evita que salte de línea al presionar Enter directo
        sendMessage();
    }
});

// Inicialización del mensaje de bienvenida estático
addMessage("bot", "Hola, soy Aster. ¿En qué puedo ayudarte?");

// --- 3. FUNCIÓN PARA LOS BOTONES DE ACCESO RÁPIDO ---
function sendQuick(text) {
    const input = document.getElementById("userInput");
    if (!input) return;

    input.value = text;
    sendMessage();
}

// --- 4. AUTO-AJUSTE DINÁMICO DEL TEXTAREA (NUEVO) ---
// Colocado al final del archivo para controlar el evento de escritura
const tx = document.getElementById("userInput");
if (tx) {
    tx.addEventListener("input", function() {
        this.style.height = "auto"; // Resetea la altura base
        this.style.height = (this.scrollHeight - 4) + "px"; // Se expande según el texto interno
    });
}