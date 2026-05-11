// ── Firebase: inicialización y helpers de Realtime Database ────────────────
// Depende de firebase-config.js (cargado antes en index.html)

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

// ── UID fijo compartido ──────────────────────────────────────────────────────
// Usamos un ID fijo para que TODOS los dispositivos lean y escriban
// en la misma ruta de Firebase. Esto reemplaza la auth anónima que
// creaba un UID diferente por cada navegador/dispositivo.
const SHARED_UID = "airbnb-principal";

function obtenerUID() {
  return SHARED_UID;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte el valor de Firebase (array u objeto con índices) a array. */
function snapToArray(val) {
  if (!val) return null;
  return Array.isArray(val) ? val : Object.values(val);
}

// ── Carga y Escritura de Datos ───────────────────────────────────────────────

/**
 * Carga el array de 12 meses para un uid + año dados.
 * Devuelve null si no existe.
 */
async function cargarDatos(uid, anio) {
  const snap = await db.ref(`usuarios/${uid}/datos/${anio}`).get();
  if (!snap.exists()) return null;
  return snapToArray(snap.val());
}

/**
 * Escucha en tiempo real los datos de un uid + año.
 * Llama a `onData(array | null)` cada vez que Firebase cambia.
 * Devuelve una función `unsuscribir()` para detener la escucha.
 */
function suscribirDatos(uid, anio, onData, onError) {
  const ref = db.ref(`usuarios/${uid}/datos/${anio}`);

  const handler = (snap) => {
    onData(snapToArray(snap.val()));
  };

  ref.on("value", handler, onError || console.error);

  // Devuelve función para cancelar la suscripción
  return () => ref.off("value", handler);
}

/**
 * Guarda el array completo de 12 meses en Firebase.
 */
async function guardarDatos(uid, anio, datos) {
  await db.ref(`usuarios/${uid}/datos/${anio}`).set(datos);
}
