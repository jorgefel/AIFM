# 🏠 Finanzas Airbnb

Aplicación web para controlar ingresos y gastos mensuales de tu propiedad en Airbnb.  
**Stack:** HTML + CSS + JavaScript vanilla · Firebase Realtime Database · Vercel

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
│   ├── firebase-config.js   ← 🔑 TUS credenciales van aquí
│   ├── firebase.js          ← init + helpers de DB
│   └── app.js               ← toda la lógica de la app
└── README.md
```

---

## 🔥 Paso 1 — Configurar Firebase

### 1.1 Crear el proyecto

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **Agregar proyecto**
3. Ponle un nombre (ej: `airbnb-finanzas`) y sigue los pasos

### 1.2 Crear la Realtime Database

1. En el menú lateral ve a **Compilación → Realtime Database**
2. Clic en **Crear base de datos**
3. Elige la región (recomendado: `us-central1`)
4. Selecciona **Iniciar en modo de prueba** → clic en **Habilitar**

### 1.3 Habilitar autenticación anónima

1. Ve a **Compilación → Authentication**
2. Clic en **Comenzar**
3. En la pestaña **Método de acceso**, busca **Anónimo**
4. Actívalo y guarda

### 1.4 Obtener las credenciales

1. Ve a **Configuración del proyecto** (ícono ⚙️ junto a *Descripción general*)
2. Baja hasta **Tus apps** y clic en el ícono web `</>`
3. Registra la app (puedes marcar *Firebase Hosting* si quieres, no es obligatorio)
4. Copia el objeto `firebaseConfig` que aparece

### 1.5 Pegar credenciales en el proyecto

Abre el archivo `js/firebase-config.js` y reemplaza los valores:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "tu-proyecto.firebaseapp.com",
  databaseURL:       "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId:         "tu-proyecto",
  storageBucket:     "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

> ⚠️ El campo `databaseURL` es obligatorio para la Realtime Database.  
> Si no aparece en el config que copias, búscalo en  
> **Realtime Database → Datos** — la URL está arriba en formato  
> `https://TU-PROYECTO-default-rtdb.firebaseio.com`

---

## 🔒 Paso 2 — Reglas de seguridad (recomendado)

En **Realtime Database → Reglas**, reemplaza el contenido con esto:

```json
{
  "rules": {
    "usuarios": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

Esto asegura que cada usuario solo accede a sus propios datos.  
Clic en **Publicar** para guardar.

---

## 🌐 Paso 3 — Desplegar en Vercel

### Opción A — Subir a GitHub y conectar con Vercel (recomendado)

1. Sube el proyecto a un repositorio en GitHub:
   ```bash
   git init
   git add .
   git commit -m "init: airbnb finanzas"
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
cd airbnb-finanzas-web
vercel
```

Sigue las instrucciones del CLI. En *Framework* elige `Other`.

---

## 🗄️ Estructura de datos en Firebase

```
/usuarios
  /{uid}                    ← id anónimo del usuario
    /datos
      /2025                 ← año
        /0                  ← enero (índice 0–11)
          noches_ocupadas: 18
          noches_disponibles: 30
          tarifa_promedio: 120000
          fijos:
            servicios: 80000
            internet: 60000
            netflix: 25000
            seguro: 30000
            otro_fijo: 0
          variables:
            limpieza: 40000
            amenities: 15000
            mantenimiento: 10000
            otro_var: 0
        /1                  ← febrero
          ...
      /2026                 ← otro año (separado automáticamente)
        ...
```

Los datos se guardan automáticamente **500 ms** después de cada cambio.

---

## 🚀 Correr en local (sin instalación)

Como es HTML/CSS/JS puro, puedes abrirlo directamente en el navegador.  
Si tu navegador bloquea scripts locales, usa cualquier servidor estático:

```bash
# Con Python (viene en macOS/Linux)
cd airbnb-finanzas-web
python3 -m http.server 8080
# Abre: http://localhost:8080

# Con Node.js (si tienes npx)
npx serve .
```
