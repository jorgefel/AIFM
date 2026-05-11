# 🏠 Finanzas Airbnb

Aplicación web para controlar ingresos y gastos mensuales de tu propiedad en Airbnb.  
**Stack:** HTML + CSS + JavaScript vanilla · LocalStorage · Vercel

---

## 📁 Estructura del proyecto

```
airbnb-finanzas-web/
├── index.html
├── vercel.json
├── .gitignore
├── css/
│   └── styles.css
├── js/
│   └── app.js               ← toda la lógica de la app
└── README.md
```

---

## 🚀 Correr en local (sin instalación)

Como es HTML/CSS/JS puro, puedes abrirlo directamente en el navegador.  
Si tu navegador bloquea scripts locales, usa cualquier servidor estático:

```bash
# Con Python (viene en macOS/Linux)
python3 -m http.server 8080
# Abre: http://localhost:8080

# Con Node.js (si tienes npx)
npx serve .
```

---

## 🗄️ Persistencia de Datos

La aplicación utiliza **LocalStorage** del navegador para guardar tus datos. Esto significa que:
- Los datos se guardan automáticamente en tu dispositivo.
- No necesitas configurar ninguna base de datos externa.
- Si borras el historial o caché del navegador para este sitio, podrías perder los datos.

Los datos se guardan automáticamente **500 ms** después de cada cambio.

---

## 🌐 Desplegar en Vercel

### Opción A — Subir a GitHub y conectar con Vercel (recomendado)

1. Sube el proyecto a un repositorio en GitHub:
   ```bash
   git init
   git add .
   git commit -m "init: airbnb finanzas local"
   git remote add origin https://github.com/tu-usuario/airbnb-finanzas-web.git
   git push -u origin main
   ```
2. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
3. Clic en **Add New → Project**
4. Importa el repositorio que acabas de crear
5. En **Framework Preset** selecciona **Other**
6. No necesitas configurar nada más — clic en **Deploy** ✅

### Opción B — Vercel CLI

```bash
npm install -g vercel
vercel
```
