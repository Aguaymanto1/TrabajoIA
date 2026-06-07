const messages = document.getElementById("messages");

// --- MEMORIA PERSISTENTE CON LOCALSTORAGE (Opción 2) ---
let chatHistory = JSON.parse(sessionStorage.getItem("poppy_chat_history")) || [];
// --- 1. FUNCIONES PARA EL INDICADOR DE ESCRITURA ---
function showTyping() {
    const row = document.createElement("div");
    row.id = "typingIndicator";
    row.className = "msg-row bot";
    row.innerHTML = `
        <div class="msg-avatar bot-av">🎬</div>
        <div class="bubble bot">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
    `;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) indicator.remove();
}

// --- 2. FUNCIÓN DE RENDERIZADO DEL CHAT ---
function addMessage(role, text, saveToStorage = true) {
    const row = document.createElement("div");
    row.className = `msg-row ${role}`; 

    const avatar = document.createElement("div");
    avatar.className = role === "user" ? "msg-avatar user-av" : "msg-avatar bot-av";
    avatar.innerText = role === "user" ? "👤" : "🎬"; 

    const bubble = document.createElement("div");
    bubble.className = `bubble ${role}`;
    
    if (role === "bot") {
        let htmlText = text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") 
            .replace(/\n/g, "<br>") 
            .replace(/(<br>)?[\*\-] (.*?)(?=(<br>|$))/g, "<li class='bot-list-item'>$2</li>"); 
        
        bubble.innerHTML = htmlText;
    } else {
        bubble.innerText = text;
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;

    // Guardar en la memoria si cumple los filtros
    if (
        saveToStorage &&
        text !== "Hola, soy Poppy. ¿En qué puedo ayudarte?" &&
        !text.includes("⏳") &&
        !text.includes("⚠️") &&
        !text.includes("Error") &&
        !text.includes("🌐")
    ) {
        chatHistory.push({ role: role, text: text });
        sessionStorage.setItem("poppy_chat_history", JSON.stringify(chatHistory));
    }
}

// --- INTERFAZ GENERATIVA: RENDERIZAR BOLETO (Opción 3) ---
function renderTicketUI(pelicula, hora, entradas, precio) {
    const ticket = document.createElement("div");
    ticket.className = "cinema-ticket animate-ticket";
    ticket.innerHTML = `
        <div class="ticket-header">
            <span class="ticket-logo">cineplanet</span>
            <div class="ticket-title-main">ENTRADA VIRTUAL</div>
        </div>
        <div class="ticket-body">
            <div class="ticket-info"><strong>PELÍCULA:</strong> <span>${pelicula}</span></div>
            <div class="ticket-info"><strong>HORARIO:</strong> <span>${hora}</span></div>
            <div class="ticket-info"><strong>ENTRADAS:</strong> <span>${entradas}</span></div>
            <div class="ticket-info"><strong>TOTAL PAGADO:</strong> <span class="ticket-price">${precio}</span></div>
        </div>
        <div class="ticket-divider"></div>
        <div class="ticket-footer">
            <div class="barcode">||||| | |||| || | ||| || | ||||</div>
            <small>Muestra el código en la entrada de la sala</small>
        </div>
    `;
    messages.appendChild(ticket);
    messages.scrollTop = messages.scrollHeight;
}

// --- 3. COMUNICACIÓN CON EL BACKEND (GROQ) ---
async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();

    if (!text) return;

    addMessage("user", text);
    input.value = "";
    input.style.height = "auto"; 

    showTyping();

    try {
        // Capturamos TODOS los filtros de la interfaz
        const filtrosWeb = {
            pelicula: document.getElementById("filtroPelicula")?.value || "",
            ciudad: document.getElementById("filtroCiudad")?.value || "",
            cine: document.getElementById("filtroCine")?.value || "",
            fecha: document.getElementById("filtroFecha")?.value || ""
        };

        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                mensaje: text, 
                historial: chatHistory,
                filtros: filtrosWeb // Enviamos el objeto completo a Python
            })
        });

        const data = await response.json();
        hideTyping();

        if (data.respuesta && (data.respuesta.includes("Error interno") || data.respuesta.includes("429 RESOURCE_EXHAUSTED"))) {
            chatHistory.pop(); 
            sessionStorage.setItem("poppy_chat_history", JSON.stringify(chatHistory));
            addMessage("bot", "⏳ Ups, estoy recibiendo muchas solicitudes en este momento. Por favor, espera unos segundos.");
            return;
        }

        // Interceptor 1: Generative UI del Ticket
        if (data.respuesta && data.respuesta.includes("[TICKET:")) {
            const ticketRegex = /\[TICKET:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/;
            const match = data.respuesta.match(ticketRegex);
            const textoLimpio = data.respuesta.replace(ticketRegex, "").trim();
            
            if (textoLimpio) addMessage("bot", textoLimpio);

            if (match) {
                const [_, pelicula, hora, entradas, precio] = match;
                renderTicketUI(pelicula, hora, entradas, precio);
            }
            return;
        }

        // Interceptor 2: Link de Pago Tradicional
        if (data.respuesta && data.respuesta.includes("[LINK_PAGO:")) {
            const regex = /\[LINK_PAGO:\s*(https?:\/\/[^\]]+)\]/;
            const match = data.respuesta.match(regex);
            const textoLimpio = data.respuesta.replace(regex, "").trim();
            
            if (textoLimpio) addMessage("bot", textoLimpio);

            if (match && match[1]) {
                const urlPago = match[1];
                const btnContenedor = document.createElement("div");
                btnContenedor.style.marginTop = "10px";

                const botonPago = document.createElement("button");
                botonPago.innerText = "💳 Proceder al Pago Seguro";
                botonPago.className = "btn-buy-ticket-chat";
                botonPago.addEventListener("click", () => {
                    alert(`🛒 Simulando pasarela de pago...\nRedireccionando de forma segura a:\n${urlPago}`);
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
        hideTyping(); 
        chatHistory.pop();
        sessionStorage.setItem("poppy_chat_history", JSON.stringify(chatHistory));
        addMessage("bot", "🌐 Lo siento, tuve un problema de conexión. Inténtalo de nuevo.");
    }
}

// --- CONFIGURACIÓN DE EVENTOS DEL CHAT ---
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault(); 
        sendMessage();
    }
});

// --- ACCESOS RÁPIDOS ---
function sendQuick(text) {
    const input = document.getElementById("userInput");
    if (!input) return;
    input.value = text;
    sendMessage();
}

// --- AUTO-AJUSTE DEL TEXTAREA ---
const tx = document.getElementById("userInput");
if (tx) {
    tx.addEventListener("input", function() {
        this.style.height = "auto"; 
        this.style.height = (this.scrollHeight - 4) + "px"; 
    });
}

// --- CONEXIÓN DE LA WEB CON EL CHAT ---
document.querySelectorAll('.btn-buy-hover').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const item = e.target.closest('.carousel-item');
        if (item) {
            const movieTitle = item.querySelector('.movie-label span').innerText;
            sendQuick(`Quiero comprar entradas para ${movieTitle}`);
        }
    });
});

// --- LÓGICA DE ABRIR/CERRAR Y CARGAR HISTORIAL ---
document.addEventListener('DOMContentLoaded', () => {
    const chatWrap = document.getElementById('chat-wrap');
    const launcher = document.getElementById('chat-launcher');
    const closeBtn = document.getElementById('close-chat');
    const badge = document.querySelector('.chat-badge');

    // Cargar mensajes previos guardados en LocalStorage
    if (chatHistory.length > 0) {
        if (badge) badge.style.display = 'none';
        chatHistory.forEach(msg => addMessage(msg.role, msg.text, false));
    } else {
        addMessage("bot", "Hola, soy Poppy. ¿En qué puedo ayudarte?", false);
    }

    launcher.addEventListener('click', () => {
        chatWrap.classList.remove('chat-hidden');
        chatWrap.classList.add('chat-visible');
        launcher.style.display = 'none';
        if (badge) badge.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
        chatWrap.classList.remove('chat-visible');
        chatWrap.classList.add('chat-hidden');
        setTimeout(() => { launcher.style.display = 'flex'; }, 300);
    });
});

// --- ACCIÓN DEL BOTÓN FILTRAR ---
const btnFiltrar = document.getElementById("btnFiltrar");
if (btnFiltrar) {
    btnFiltrar.addEventListener("click", () => {
        // Abre el chat
        const chatWrap = document.getElementById('chat-wrap');
        const launcher = document.getElementById('chat-launcher');
        const badge = document.querySelector('.chat-badge');
        
        chatWrap.classList.remove('chat-hidden');
        chatWrap.classList.add('chat-visible');
        launcher.style.display = 'none';
        if (badge) badge.style.display = 'none';

        // Dispara la consulta automáticamente
        sendQuick("He usado los filtros de la web, ¿qué opciones me das con esa configuración?");
    });
}