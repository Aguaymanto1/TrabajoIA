# 🎬 Poppy — Asistente Virtual Oficial de Cineplanet Perú

Este proyecto consiste en una aplicación web interactiva y unificada que integra la interfaz de usuario de **Cineplanet** con un chatbot inteligente llamado **Poppy**. El asistente guía al usuario paso a paso en la consulta de cartelera, dulcería, promociones y el flujo completo de reserva de entradas utilizando la API de **Groq** con el modelo de lenguaje de última generación `llama-3.3-70b-versatile`.

---

## 🚀 Características Principales

* **Arquitectura Unificada (Monolito Ligero):** Servidor Flask que gestiona tanto el renderizado de la interfaz estática (HTML5, CSS3, JS) como la lógica del backend de la API.
* **Diseño Moderno e Interactivo:** Bento grid para la sección de películas y una interfaz de chat responsiva y estilizada con componentes dinámicos (burbujas adaptativas, text-area expansivo y botones de acceso rápido).
* **Flujo Transaccional Estricto:** Control estricto del estado de la conversación (Scrum User Stories / Flujo GIVEN-WHEN-THEN) que obliga a respetar el orden de reserva (Local ➡️ Fecha ➡️ Película ➡️ Horario ➡️ Entradas ➡️ Combos ➡️ Pago).
* **Guardrails de Seguridad y Anti-Engaño:** Filtros de entrada/salida para mitigar inyecciones de texto (palabras prohibidas) y validación lógica para evitar que el usuario salte pasos o simule datos inexistentes en el historial.
* **Inyección Dinámica de Contexto:** Sincronización en tiempo real de la fecha del servidor para la validación exacta de funciones y restricciones temporales (Cartelera Junio 2026).

---

## 🛠️ Tecnologías Utilizadas

* **Backend:** Python 3.x, Flask, Flask-CORS, Gunicorn
* **Inteligencia Artificial:** Groq SDK (`llama-3.3-70b-versatile`)
* **Frontend:** HTML5, CSS3 (Variables nativas, Flexbox, Grid), JavaScript (Vanilla ES6)
* **Variables de Entorno:** Python-dotenv

---

## 📂 Estructura del Proyecto

```text
TRABAJOIA/
│
├── static/                  # Archivos estáticos del Frontend
│   ├── style.css            # Estilos modernos de la web y el chatbot
│   └── script.js            # Lógica del chat, auto-scroll y peticiones fetch
│
├── templates/               # Plantillas de renderizado de Flask
│   └── index.html           # Interfaz principal de la cartelera Cineplanet
│
├── .env                     # Variables de entorno locales (Excluido en .gitignore)
├── app.py                   # Servidor principal Flask y orquestación con Groq
├── requirements.txt         # Dependencias del proyecto para producción
└── README.md                # Documentación del sistema

