# 🎬 Poppy — Asistente Virtual y Motor Transaccional de Cineplanet Perú

Este proyecto es una aplicación web interactiva que integra una réplica fiel de la interfaz de **Cineplanet** con **Poppy**, un chatbot inteligente de nivel de producción. El sistema no solo responde preguntas, sino que actúa como un motor de recomendación y transacciones, guiando al usuario por un embudo de ventas dinámico utilizando la API de **Groq** (`llama-3.3-70b-versatile`) y técnicas avanzadas de Prompt Engineering.

---

## 🚀 Características Principales y Arquitectura

* **Motor de Inferencia y RAG Simulado:** Integración de un catálogo dinámico (`cartelera.json`) que permite a la IA cruzar variables complejas (presupuesto, compañía, aforo y filtros de la UI) para dar recomendaciones precisas en milisegundos.
* **Conciencia Temporal y Espacial Continua:** La IA lee la hora del servidor y los selectores del frontend en tiempo real. Bloquea la venta de funciones pasadas y filtra sedes automáticamente sin intervención del usuario.
* **Generative UI (Interfaz Generativa):** El backend controla el DOM. Al finalizar una reserva, la IA no solo envía texto, sino que dispara comandos para renderizar un **boleto virtual interactivo** con estilos CSS dedicados.
* **Persistencia de Sesión Volátil:** Uso de `sessionStorage` en Vanilla JS. La conversación y el contexto del usuario sobreviven a recargas de página, pero se destruyen al cerrar la pestaña, garantizando privacidad y limpieza de memoria.
* **Defensas Anti-Jailbreak y Seguridad:** Jerarquías estrictas en el prompt para evitar ataques de inyección, evasión de pagos y control estricto del tono corporativo (manejo de Out-of-Domain y jerga local).
* **Simulación Transaccional Realista:** Generación de UUIDs criptográficos únicos por cada reserva validada, imitando el comportamiento de un endpoint de control de accesos real.

---

## 🛠️ Stack Tecnológico

* **Backend & Orquestación:** Python 3.x, Flask, Flask-CORS, UUID.
* **Inteligencia Artificial:** Groq SDK (`llama-3.3-70b-versatile`).
* **Frontend:** HTML5, CSS3 (Variables nativas, Grid Bento), JavaScript (Vanilla ES6, Fetch API).
* **Datos:** JSON (Base de conocimiento local).
* **Despliegue & Entorno:** Gunicorn, Python-dotenv (Listo para Render/Heroku).

---

## 📂 Estructura del Proyecto

```text
TRABAJOIA/
│
├── static/                  # Archivos estáticos del Frontend
│   ├── posters/             # Imágenes y assets de películas/logos
│   ├── style.css            # Estilos modernos (Bento Grid, Generative UI, Chatbot)
│   └── script.js            # Lógica cliente (Memoria, Interceptores, Fetch)
│
├── templates/               # Plantillas de renderizado de Flask
│   └── index.html           # Interfaz principal de la cartelera Cineplanet
│
├── .env                     # Variables de entorno locales (Excluido vía .gitignore)
├── app.py                   # Servidor Flask, Prompt Engineering y lógica de negocio
├── cartelera.json           # Base de datos local (Catálogo, precios, sedes y horarios)
├── requirements.txt         # Dependencias del proyecto para producción
└── README.md                # Documentación del sistema
