// ── Constantes ──────────────────────────────────────────────────────────────
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const COMISION = 0.03;

const FIJOS_LABELS = {
  servicios: "Servicios públicos",
  internet:  "Internet",
  netflix:   "Netflix / Streaming",
  seguro:    "Seguro",
  otro_fijo: "Otro fijo"
};

const VAR_LABELS = {
  limpieza:      "Limpieza",
  amenities:     "Amenities",
  mantenimiento: "Mantenimiento",
  otro_var:      "Otro variable"
};

const CHART_COLORS = {
  teal:    "#10B981",
  orange:  "#F97316",
  red:     "#EF4444",
  dark:    "#0F172A",
  yellow:  "#F59E0B",
  accent:  "#C5A059"
};

// ── Estado global ────────────────────────────────────────────────────────────
const state = {
  storageKey: "aifm_data",
  anio:      new Date().getFullYear(),
  mesActivo: new Date().getMonth(),
  datos:     crearDatosVacios(),
  guardandoTimer: null,
  sidebarCollapsed: false,
  escribiendo: false
};

// ── Charts (instancias de Chart.js) ─────────────────────────────────────────
const charts = { pie: null, bar: null, line: null, ocup: null };

// ── Helpers de formato ───────────────────────────────────────────────────────
function fmt(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  }).format(v || 0);
}

function pct(v) {
  return `${(v || 0).toFixed(1)}%`;
}

// ── Datos por defecto ────────────────────────────────────────────────────────
function mesVacio() {
  return {
    noches_ocupadas:    0,
    noches_disponibles: 30,
    tarifa_promedio:    0,
    fijos:     { servicios: 0, internet: 0, netflix: 0, seguro: 0, otro_fijo: 0 },
    variables: { limpieza: 0, amenities: 0, mantenimiento: 0, otro_var: 0 }
  };
}

function crearDatosVacios() {
  return MESES.map(() => mesVacio());
}

function normalizarDatos(raw) {
  return MESES.map((_, i) => {
    const src = raw[i] || {};
    return {
      noches_ocupadas:    src.noches_ocupadas    || 0,
      noches_disponibles: src.noches_disponibles || 30,
      tarifa_promedio:    src.tarifa_promedio    || 0,
      fijos: {
        ...mesVacio().fijos,
        ...(src.fijos || {})
      },
      variables: {
        ...mesVacio().variables,
        ...(src.variables || {})
      }
    };
  });
}

// ── Cálculos ─────────────────────────────────────────────────────────────────
function calcular(d) {
  const ingresos    = (d.noches_ocupadas || 0) * (d.tarifa_promedio || 0);
  const comision    = ingresos * COMISION;
  const totalFijos  = Object.values(d.fijos).reduce((a, b) => a + (b || 0), 0);
  const totalVar    = Object.values(d.variables).reduce((a, b) => a + (b || 0), 0) + comision;
  const totalGastos = totalFijos + totalVar;
  const ganancia    = ingresos - totalGastos;
  const ocupacion   = d.noches_disponibles > 0 ? (d.noches_ocupadas / d.noches_disponibles) * 100 : 0;
  const revpar      = d.noches_disponibles > 0 ? ingresos / d.noches_disponibles : 0;
  const margen      = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;
  return { ingresos, comision, totalFijos, totalVar, totalGastos, ganancia, ocupacion, revpar, margen };
}

function historial() {
  return MESES.map((mes, i) => ({ mes, ...calcular(state.datos[i]) }));
}

// ── Persistencia Local: guardar con debounce ─────────────────────────────────
function guardarConDebounce() {
  clearTimeout(state.guardandoTimer);
  mostrarBadge(true);
  state.guardandoTimer = setTimeout(() => {
    try {
      const allData = JSON.parse(localStorage.getItem(state.storageKey) || "{}");
      allData[state.anio] = state.datos;
      localStorage.setItem(state.storageKey, JSON.stringify(allData));
    } catch (e) {
      console.error("Error al guardar en localStorage:", e);
    } finally {
      mostrarBadge(false);
      state.guardandoTimer = null;
    }
  }, 500);
}

function mostrarBadge(visible) {
  const el = document.getElementById("saving-badge");
  if (el) el.classList.toggle("hidden", !visible);
}

// ── Creación de campos de formulario ─────────────────────────────────────────
function crearField(label, value, prefix, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "field";

  const lbl = document.createElement("label");
  lbl.textContent = label;

  const inputWrap = document.createElement("div");
  inputWrap.className = "field-input-wrap";

  const pfx = document.createElement("span");
  pfx.className = "field-prefix";
  pfx.textContent = prefix;

  const input = document.createElement("input");
  input.type = "number";
  input.min  = "0";
  input.value = value || "";
  input.placeholder = "0";

  const handler = (e) => {
    const v = parseFloat(e.target.value) || 0;
    onChange(v);
    renderStats();
    guardarConDebounce();
  };

  input.addEventListener("change", handler);
  input.addEventListener("input", handler);

  inputWrap.appendChild(pfx);
  inputWrap.appendChild(input);
  wrap.appendChild(lbl);
  wrap.appendChild(inputWrap);
  return wrap;
}

// ── Render: Selectores de mes, año y opciones de la barra ────────────────────
function setupSelectores() {
  const selectsMes = [document.getElementById("select-mes"), document.getElementById("mobile-select-mes")];
  const selectsAnio = [document.getElementById("select-anio"), document.getElementById("mobile-select-anio")];

  selectsMes.forEach(sel => {
    if(!sel) return;
    sel.addEventListener("change", (e) => {
      state.mesActivo = parseInt(e.target.value);
      renderDashboard();
    });
  });

  selectsAnio.forEach(sel => {
    if(!sel) return;
    sel.addEventListener("change", (e) => {
      const newAnio = parseInt(e.target.value);
      if (newAnio !== state.anio) {
        state.anio = newAnio;
        state.mesActivo = 0;
        selectsMes.forEach(s => { if(s) s.value = 0; });
        cargarAnio();
      }
    });
  });
}

function renderSelectores() {
  const selectsMes = [document.getElementById("select-mes"), document.getElementById("mobile-select-mes")];
  const selectsAnio = [document.getElementById("select-anio"), document.getElementById("mobile-select-anio")];

  // Meses
  selectsMes.forEach(selMes => {
    if(!selMes) return;
    selMes.innerHTML = "";
    MESES_FULL.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m;
      if (i === state.mesActivo) opt.selected = true;
      selMes.appendChild(opt);
    });
  });

  // Años (rango de 5 años atrás hasta 2 años adelante)
  const currentYear = new Date().getFullYear();
  selectsAnio.forEach(selAnio => {
    if(!selAnio) return;
    selAnio.innerHTML = "";
    for (let y = currentYear - 5; y <= currentYear + 2; y++) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      if (y === state.anio) opt.selected = true;
      selAnio.appendChild(opt);
    }
  });
}

// ── Render: todo el dashboard ────────────────────────────────────────────────
function renderDashboard() {
  renderResumen();
  renderGraficas();
  renderHistorial();
}

// ── Render: resumen ──────────────────────────────────────────────────────────
function renderResumen() {
  const mes = state.datos[state.mesActivo];
  const s   = calcular(mes);
  
  // Previous month data for comparison
  const prevMesIdx = state.mesActivo === 0 ? 11 : state.mesActivo - 1;
  const prevMes = state.datos[prevMesIdx];
  const sPrev = calcular(prevMes);
  
  const calcPctChange = (curr, prev) => prev === 0 ? 0 : ((curr - prev) / prev) * 100;
  const ingrPct = calcPctChange(s.ingresos, sPrev.ingresos);
  const gasPct = calcPctChange(s.totalGastos, sPrev.totalGastos);

  // Period label in top bar
  document.querySelectorAll(".period-month-label").forEach(el => el.textContent = MESES_FULL[state.mesActivo]);
  document.querySelectorAll(".period-year-label").forEach(el => el.textContent = state.anio);
  
  const phMes = document.getElementById("ph-mes");
  if (phMes) phMes.textContent = MESES_FULL[state.mesActivo];
  const phAnio = document.getElementById("ph-anio");
  if (phAnio) phAnio.textContent = state.anio;

  const periodEl = document.getElementById("resumen-period");
  if (periodEl) periodEl.textContent = `${MESES_FULL[state.mesActivo]} ${state.anio}`;

  // Ingresos
  const elIngresos = document.getElementById("val-ingresos");
  if (elIngresos) elIngresos.textContent = fmt(s.ingresos);
  const elIngresosPct = document.getElementById("val-ingresos-pct");
  if (elIngresosPct) elIngresosPct.textContent = `${ingrPct >= 0 ? '+' : ''}${ingrPct.toFixed(0)}%`;

  // Gastos
  const elGastos = document.getElementById("val-gastos");
  if (elGastos) elGastos.textContent = fmt(s.totalGastos);
  const elGastosPct = document.getElementById("val-gastos-pct");
  if (elGastosPct) elGastosPct.textContent = `${gasPct >= 0 ? '+' : ''}${gasPct.toFixed(0)}%`;

  // Ganancia
  const elGanancia = document.getElementById("val-ganancia");
  if (elGanancia) elGanancia.textContent = fmt(s.ganancia);
  const elGananciaSub = document.getElementById("val-ganancia-sub");
  if (elGananciaSub) elGananciaSub.textContent = s.ganancia >= 0 ? "Crecimiento sólido" : "En pérdida";

  // Margen
  const elMargen = document.getElementById("val-margen");
  if (elMargen) elMargen.textContent = `${s.margen.toFixed(0)}%`;
  const pathMargen = document.getElementById("path-margen");
  if (pathMargen) pathMargen.setAttribute("stroke-dasharray", `${Math.max(0, s.margen)}, 100`);

  // Ocupación
  const elOcup = document.getElementById("val-ocupacion");
  if (elOcup) elOcup.textContent = `${s.ocupacion.toFixed(0)}%`;
  const elOcupSub = document.getElementById("val-ocupacion-sub");
  if (elOcupSub) elOcupSub.textContent = `${mes.noches_ocupadas} de ${mes.noches_disponibles} noches reservadas`;
  const pathOcup = document.getElementById("path-ocupacion");
  if (pathOcup) pathOcup.setAttribute("stroke-dasharray", `${s.ocupacion}, 100`);

  // Tarifa
  const elTarifa = document.getElementById("val-tarifa");
  if (elTarifa) elTarifa.textContent = fmt(mes.tarifa_promedio);
  const elTarifaMes = document.getElementById("tarifa-mes-label");
  if (elTarifaMes) elTarifaMes.textContent = MESES_FULL[state.mesActivo];
}

// ── Render: stats en tiempo real (ingresos / gastos / comisión) ───────────────
function renderStats() {
  const mes = state.datos[state.mesActivo];
  const s   = calcular(mes);

  const ti = document.getElementById("total-ingresos");
  const tf = document.getElementById("total-fijos");
  const tv = document.getElementById("total-variables");
  const tc = document.getElementById("comision-val");

  if (ti) ti.textContent = fmt(s.ingresos);
  if (tf) tf.textContent = fmt(s.totalFijos);
  if (tv) tv.textContent = fmt(s.totalVar);
  if (tc) tc.textContent = fmt(s.comision);

  // Actualizar resumen y gráficas si están visibles
  renderResumen();
}

// ── Render: ingresos (modal) ─────────────────────────────────────────────────
function renderIngresos() {
  const mes = state.datos[state.mesActivo];
  const s   = calcular(mes);

  const title = document.getElementById("ingresos-title");
  if (title) title.textContent = `Ingresos — ${MESES_FULL[state.mesActivo]} ${state.anio}`;
  
  const ti = document.getElementById("total-ingresos");
  if (ti) ti.textContent = fmt(s.ingresos);

  const group = document.getElementById("fields-ingresos");
  group.innerHTML = "";

  group.appendChild(crearField(
    "Noches disponibles en el mes", mes.noches_disponibles, "#",
    v => { state.datos[state.mesActivo].noches_disponibles = v; }
  ));
  group.appendChild(crearField(
    "Noches ocupadas", mes.noches_ocupadas, "#",
    v => { state.datos[state.mesActivo].noches_ocupadas = v; }
  ));
  group.appendChild(crearField(
    "Tarifa promedio por noche (COP)", mes.tarifa_promedio, "$",
    v => { state.datos[state.mesActivo].tarifa_promedio = v; }
  ));
}

// ── Render: gastos (modal) ───────────────────────────────────────────────────
function renderGastos() {
  const mes = state.datos[state.mesActivo];
  const s   = calcular(mes);

  const title = document.getElementById("gastos-title");
  if (title) title.textContent = `Gastos — ${MESES_FULL[state.mesActivo]} ${state.anio}`;
  
  const tf = document.getElementById("total-fijos");
  const tv = document.getElementById("total-variables");
  const tc = document.getElementById("comision-val");
  if (tf) tf.textContent = fmt(s.totalFijos);
  if (tv) tv.textContent = fmt(s.totalVar);
  if (tc) tc.textContent = fmt(s.comision);

  // Fijos
  const gFijos = document.getElementById("fields-fijos");
  gFijos.innerHTML = "";
  Object.entries(FIJOS_LABELS).forEach(([k, label]) => {
    gFijos.appendChild(crearField(label, mes.fijos[k], "$",
      v => { state.datos[state.mesActivo].fijos[k] = v; }
    ));
  });

  // Variables
  const gVars = document.getElementById("fields-variables");
  gVars.innerHTML = "";
  Object.entries(VAR_LABELS).forEach(([k, label]) => {
    gVars.appendChild(crearField(label, mes.variables[k], "$",
      v => { state.datos[state.mesActivo].variables[k] = v; }
    ));
  });
}

// ── Render: gráficas ─────────────────────────────────────────────────────────
function renderGraficas() {
  const s    = calcular(state.datos[state.mesActivo]);
  const hist = historial();

  const pieTitle = document.getElementById("pie-title");
  if (pieTitle) pieTitle.textContent = `Distribución — ${MESES[state.mesActivo]}`;
  
  const barTitle = document.getElementById("bar-title");
  if (barTitle) barTitle.textContent = `Ingresos vs Gastos — ${state.anio}`;

  const labels    = MESES;
  const ingrArr   = hist.map(h => h.ingresos);
  const gastosArr = hist.map(h => h.totalGastos);
  const ganArr    = hist.map(h => h.ganancia);
  const ocupArr   = hist.map(h => parseFloat(h.ocupacion.toFixed(1)));

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const gridColor = isDark ? "#334155" : "#E2E8F0";

  Chart.defaults.color = textColor;

  // ── Pie ──
  const pieData = [
    { name: "G. Fijos",     value: s.totalFijos,               color: CHART_COLORS.red    },
    { name: "G. Variables", value: s.totalVar,                  color: CHART_COLORS.orange },
    { name: "Ganancia",     value: Math.max(s.ganancia, 0),    color: CHART_COLORS.teal   }
  ].filter(d => d.value > 0);

  const pieCanvas = document.getElementById("chart-pie");
  const pieEmpty  = document.getElementById("pie-empty");

  if (pieData.length === 0) {
    pieEmpty.classList.remove("hidden");
    pieCanvas.classList.add("hidden");
  } else {
    pieEmpty.classList.add("hidden");
    pieCanvas.classList.remove("hidden");
    destroyChart("pie");
    charts.pie = new Chart(pieCanvas, {
      type: "doughnut",
      data: {
        labels: pieData.map(d => d.name),
        datasets: [{
          data:            pieData.map(d => d.value),
          backgroundColor: pieData.map(d => d.color),
          borderWidth: 2, borderColor: "#fff"
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 11, family: "'Outfit'" }, padding: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } }
        },
        cutout: "60%"
      }
    });
  }

  // ── Bar: ingresos vs gastos ──
  destroyChart("bar");
  charts.bar = new Chart(document.getElementById("chart-bar"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Ingresos", data: ingrArr,   backgroundColor: CHART_COLORS.teal,   borderRadius: 4 },
        { label: "Gastos",   data: gastosArr, backgroundColor: CHART_COLORS.orange, borderRadius: 4 }
      ]
    },
    options: chartOptionsBase("COP")
  });

  // ── Line: ganancia ──
  destroyChart("line");
  charts.line = new Chart(document.getElementById("chart-line"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Ganancia", data: ganArr,
        borderColor: CHART_COLORS.accent, backgroundColor: "rgba(197,160,89,0.08)",
        borderWidth: 2, pointRadius: 4, pointBackgroundColor: CHART_COLORS.accent,
        tension: 0.3, fill: true
      }]
    },
    options: chartOptionsBase("COP")
  });

  // ── Bar: ocupación ──
  destroyChart("ocup");
  charts.ocup = new Chart(document.getElementById("chart-ocup"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Ocupación %", data: ocupArr,
        backgroundColor: CHART_COLORS.yellow, borderRadius: 4
      }]
    },
    options: {
      ...chartOptionsBase("%"),
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { max: 100, ticks: { font: { size: 10 }, callback: v => `${v}%` }, grid: { color: "#f0f0f0" } }
      }
    }
  });
}

function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); charts[key] = null; }
}

function chartOptionsBase(unit) {
  const isCOP = unit === "COP";
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const gridColor = isDark ? "#334155" : "#E2E8F0";

  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { size: 11, family: "'Outfit'" } } },
      tooltip: {
        callbacks: {
          label: ctx => isCOP ? ` ${fmt(ctx.raw)}` : ` ${ctx.raw.toFixed(1)}%`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
      y: {
        ticks: {
          color: textColor,
          font: { size: 10 },
          callback: v => isCOP ? `${(v/1000).toFixed(0)}k` : `${v}%`
        },
        grid: { color: gridColor }
      }
    }
  };
}

// ── Render: historial ─────────────────────────────────────────────────────────
function renderHistorial() {
  const hist = historial();

  const periodEl = document.getElementById("historial-period");
  if (periodEl) periodEl.textContent = `${state.anio}`;

  const tbody = document.getElementById("tabla-body");
  tbody.innerHTML = "";

  let totIng = 0, totFij = 0, totVar = 0, totGan = 0;

  hist.forEach((h, i) => {
    totIng += h.ingresos;
    totFij += h.totalFijos;
    totVar += h.totalVar;
    totGan += h.ganancia;

    const tr = document.createElement("tr");
    if (i === state.mesActivo) tr.classList.add("active-row");

    const esPendiente = h.ingresos === 0 && h.totalGastos === 0;
    const statusHtml = esPendiente 
      ? '<span class="status-badge pending">Pendiente</span>'
      : '<span class="status-badge closed">Cerrado</span>';
    const cellClass = esPendiente ? 'text-muted' : '';

    tr.innerHTML = `
      <td class="${cellClass}">${h.mes}</td>
      <td class="${cellClass}">${esPendiente ? '—' : fmt(h.ingresos)}</td>
      <td class="${cellClass}">${esPendiente ? '—' : fmt(h.totalFijos)}</td>
      <td class="${cellClass}">${esPendiente ? '—' : fmt(h.totalVar)}</td>
      <td class="${esPendiente ? 'text-muted' : (h.ganancia >= 0 ? 'ganancia-pos' : 'ganancia-neg')}">${esPendiente ? '—' : fmt(h.ganancia)}</td>
      <td class="text-right">${statusHtml}</td>
    `;

    tr.addEventListener("click", () => {
      state.mesActivo = i;
      document.getElementById("select-mes").value = i;
      renderDashboard();
    });

    tbody.appendChild(tr);
    tbody.appendChild(tr);

    // Mobile List Item
    const mlList = document.getElementById("historial-mobile-list");
    if (mlList) {
      if (i === 0) mlList.innerHTML = ""; // Limpiar antes del primer item
      const mItem = document.createElement("div");
      mItem.className = "historial-m-item";
      if (i === state.mesActivo) mItem.style.border = "2px solid var(--primary-fixed-dim)";
      mItem.innerHTML = `
        <div class="hm-date-box">
          <div class="hm-mes">${h.mes}</div>
          <div class="hm-anio">${state.anio.toString().slice(-2)}</div>
        </div>
        <div class="hm-content">
          <div class="hm-title">Ingresos ${MESES_FULL[i]}</div>
          <div class="hm-subtitle">${h.noches_ocupadas} Noches confirmadas</div>
        </div>
        <div class="hm-value">${esPendiente ? '—' : (h.ingresos > 0 ? '+' : '') + fmt(h.ingresos)}</div>
      `;
      mItem.addEventListener("click", () => {
        state.mesActivo = i;
        document.querySelectorAll("#select-mes, #mobile-select-mes").forEach(s => s.value = i);
        renderDashboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      mlList.appendChild(mItem);
    }
  });

  // Tfoot total
  const tfoot = document.getElementById("tabla-foot");
  tfoot.innerHTML = `
    <tr class="total-row-table">
      <td>Totales YTD</td>
      <td>${fmt(totIng)}</td>
      <td>${fmt(totFij)}</td>
      <td>${fmt(totVar)}</td>
      <td class="${totGan >= 0 ? 'ganancia-pos' : 'ganancia-neg'}">${fmt(totGan)}</td>
      <td></td>
    </tr>
  `;
}

// ── Sidebar Toggle ───────────────────────────────────────────────────────────
function setupSidebar() {
  const btn = document.getElementById("sidebar-toggle");
  const aside = document.getElementById("sidebar");

  if (btn && aside) {
    btn.onclick = (e) => {
      e.stopPropagation();
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        aside.classList.toggle("mobile-open");
        toggleOverlay(aside.classList.contains("mobile-open"));
      } else {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        aside.classList.toggle("collapsed", state.sidebarCollapsed);
      }
    };
  }

  // Close sidebar on mobile when clicking outside
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      const aside = document.getElementById("sidebar");
      if (aside && aside.classList.contains("mobile-open") && !aside.contains(e.target)) {
        aside.classList.remove("mobile-open");
        toggleOverlay(false);
      }
    }
  });
}

function toggleOverlay(show) {
  let overlay = document.querySelector(".sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", () => {
      const aside = document.getElementById("sidebar");
      if (aside) aside.classList.remove("mobile-open");
      toggleOverlay(false);
    });
  }
  overlay.classList.toggle("active", show);
}

// ── Modals ───────────────────────────────────────────────────────────────────
function setupModals() {
  // Ingresos
  document.getElementById("open-ingresos").addEventListener("click", () => {
    renderIngresos();
    document.getElementById("modal-ingresos").classList.remove("hidden");
    closeMobileSidebar();
  });

  document.getElementById("close-ingresos").addEventListener("click", () => {
    document.getElementById("modal-ingresos").classList.add("hidden");
    renderDashboard();
  });

  // Gastos
  document.getElementById("open-gastos").addEventListener("click", () => {
    renderGastos();
    document.getElementById("modal-gastos").classList.remove("hidden");
    closeMobileSidebar();
  });

  document.getElementById("close-gastos").addEventListener("click", () => {
    document.getElementById("modal-gastos").classList.add("hidden");
    renderDashboard();
  });

  // Click overlay to close modals
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.add("hidden");
        renderDashboard();
      }
    });
  });

  // Dashboard nav button
  document.getElementById("nav-dashboard").addEventListener("click", () => {
    closeMobileSidebar();
  });
}

function closeMobileSidebar() {
  if (window.innerWidth <= 768) {
    const aside = document.getElementById("sidebar");
    if (aside) aside.classList.remove("mobile-open");
    toggleOverlay(false);
  }
}

// ── Theme Toggle ─────────────────────────────────────────────────────────────
function setupTheme() {
  const btnTheme = document.getElementById("btn-theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeLabel = document.getElementById("theme-label");

  const setThemeUI = (theme) => {
    if (theme === "dark") {
      if (themeIcon) themeIcon.textContent = "light_mode";
      if (themeLabel) themeLabel.textContent = "Tema Claro";
    } else {
      if (themeIcon) themeIcon.textContent = "dark_mode";
      if (themeLabel) themeLabel.textContent = "Tema Oscuro";
    }
  };
  
  // Cargar tema guardado o preferencia del sistema
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.setAttribute("data-theme", "dark");
    setThemeUI("dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    setThemeUI("light");
  }

  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "dark") {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        setThemeUI("light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        setThemeUI("dark");
      }
      // Re-renderizar gráficas para actualizar colores de fuente/grid si fuera necesario
      if (window.innerWidth > 0) {
          renderGraficas();
      }
    });
  }
}

// ── Exportar Informe ─────────────────────────────────────────────────────────
function setupExport() {
  const btnExport = document.getElementById("btn-export");
  if (!btnExport) return;

  btnExport.addEventListener("click", () => {
    const hist = historial();
    
    let csv = "Mes,Ingresos,G. Fijos,G. Variables,Ganancia,Ocupacion,Margen\n";
    hist.forEach(h => {
      csv += `${h.mes},${h.ingresos},${h.totalFijos},${h.totalVar},${h.ganancia},${h.ocupacion.toFixed(1)}%,${h.margen.toFixed(1)}%\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Finanzas_${state.anio}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// ── Pantallas de estado ───────────────────────────────────────────────────────
function mostrarLoader(visible) {
  const el = document.getElementById("loader");
  if (el) el.classList.toggle("hidden", !visible);
}

function mostrarApp(visible) {
  const el = document.getElementById("app");
  if (el) el.classList.toggle("hidden", !visible);
}

function mostrarError(msg) {
  mostrarLoader(false);
  mostrarApp(false);
  const screen = document.getElementById("error-screen");
  if (screen) screen.classList.remove("hidden");
  const msgEl = document.getElementById("error-msg");
  if (msgEl) msgEl.textContent = msg;
}

// ── Mobile Bottom Nav ────────────────────────────────────────────────────────
function setupMobileNav() {
  const mbDashboard = document.getElementById("mb-nav-dashboard");
  const mbIngresos = document.getElementById("mb-nav-ingresos");
  const mbGastos = document.getElementById("mb-nav-gastos");
  const mbAddBtn = document.getElementById("mb-add-btn");
  const mbTheme = document.getElementById("mb-theme-toggle");

  if (mbDashboard) {
    mbDashboard.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (mbIngresos) {
    mbIngresos.addEventListener("click", () => {
      renderIngresos();
      document.getElementById("modal-ingresos").classList.remove("hidden");
    });
  }
  if (mbGastos) {
    mbGastos.addEventListener("click", () => {
      renderGastos();
      document.getElementById("modal-gastos").classList.remove("hidden");
    });
  }
  if (mbTheme) {
    mbTheme.addEventListener("click", () => {
      const btnThemeDesktop = document.getElementById("btn-theme-toggle");
      if (btnThemeDesktop) btnThemeDesktop.click();
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SISTEMA DE PROYECCIONES FINANCIERAS ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Recopila todos los datos históricos disponibles en Firebase y los ordena
 * cronológicamente. Devuelve un array plano de objetos:
 *   { anio, mes (0-11), ingresos, totalGastos, ganancia }
 * Solo incluye meses que tengan datos reales (ingresos > 0 o gastos > 0).
 */
async function obtenerHistorialCompleto() {
  const allData = JSON.parse(localStorage.getItem(state.storageKey) || "{}");
  const historial = [];

  Object.keys(allData).forEach(anioStr => {
    const anio = parseInt(anioStr);
    const raw = allData[anioStr];
    if (!raw) return;

    const datos = normalizarDatos(raw);

    datos.forEach((d, mesIdx) => {
      const calc = calcular(d);
      if (calc.ingresos > 0 || calc.totalGastos > 0) {
        const diasDelMes = new Date(anio, mesIdx + 1, 0).getDate();
        const ocupacionReal = ((d.noches_ocupadas || 0) / diasDelMes) * 100;

        historial.push({
          anio,
          mes: mesIdx,
          ingresos: calc.ingresos || 0,
          totalGastos: calc.totalGastos || 0,
          ganancia: calc.ganancia || 0,
          ocupacion: ocupacionReal,
          noches_ocupadas: d.noches_ocupadas || 0,
          tarifa: d.tarifa_promedio || 0
        });
      }
    });
  });

  historial.sort((a, b) => a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio);
  return historial;
}

/**
 * Algoritmo A — Crecimiento Interanual (Estacional)
 * 
 * Fórmula Ingresos: Valor_Mes_Año_Pasado * (1 + Factor_Crecimiento_Ingresos)
 * Fórmula Ocupación: Ocup_Mes_Año_Pasado * (1 + Factor_Crecimiento_Ocupación)
 */
function calcularCrecimientoInteranual(historial, mesObjetivo, anioObjetivo) {
  const anioAnterior = anioObjetivo - 1;
  const datoMesAnterior = historial.find(
    h => h.anio === anioAnterior && h.mes === mesObjetivo
  );

  if (!datoMesAnterior || datoMesAnterior.ingresos <= 0) {
    return null; // No hay datos del año anterior para este mes
  }

  const mesesAnteriores = historial.filter(h => {
    if (h.anio < anioObjetivo) return true;
    if (h.anio === anioObjetivo && h.mes < mesObjetivo) return true;
    return false;
  });

  const ultimos3 = mesesAnteriores.slice(-3);

  if (ultimos3.length < 3) {
    return null; // No hay suficientes meses recientes
  }

  let sumaRecienteIng = 0;
  let sumaAnteriorIng = 0;
  let sumaRecienteOcup = 0;
  let sumaAnteriorOcup = 0;
  let paresValidos = 0;

  ultimos3.forEach(mesReciente => {
    const equivalente = historial.find(
      h => h.anio === mesReciente.anio - 1 && h.mes === mesReciente.mes
    );
    if (equivalente && equivalente.ingresos > 0) {
      sumaRecienteIng += mesReciente.ingresos;
      sumaAnteriorIng += equivalente.ingresos;
      sumaRecienteOcup += mesReciente.ocupacion;
      sumaAnteriorOcup += equivalente.ocupacion;
      paresValidos++;
    }
  });

  if (paresValidos === 0 || sumaAnteriorIng === 0) {
    return {
      valor: datoMesAnterior.ingresos,
      ocupacion: datoMesAnterior.ocupacion,
      factorCrecimiento: 0
    };
  }

  // Crecimiento de ingresos
  const promedioRecienteIng = sumaRecienteIng / paresValidos;
  const promedioAnteriorIng = sumaAnteriorIng / paresValidos;
  const factorCrecimientoIng = (promedioRecienteIng - promedioAnteriorIng) / promedioAnteriorIng;

  // Tendencia de ocupación
  const promedioRecienteOcup = sumaRecienteOcup / paresValidos;
  const promedioAnteriorOcup = sumaAnteriorOcup / paresValidos;
  const factorCrecimientoOcup = promedioAnteriorOcup > 0 ? (promedioRecienteOcup - promedioAnteriorOcup) / promedioAnteriorOcup : 0;

  const proyeccionIngresos = datoMesAnterior.ingresos * (1 + factorCrecimientoIng);
  
  let proyeccionOcupacion = datoMesAnterior.ocupacion * (1 + factorCrecimientoOcup);
  proyeccionOcupacion = Math.max(0, Math.min(100, proyeccionOcupacion)); // Limitar al 100%

  return {
    valor: Math.max(0, Math.round(proyeccionIngresos)),
    ocupacion: proyeccionOcupacion,
    factorCrecimiento: factorCrecimientoIng
  };
}

/**
 * Algoritmo B — Rendimiento Actual (Tendencia)
 * 
 * Toma los últimos 3 meses disponibles y calcula la media móvil de 
 * ingresos y el promedio de ocupación para proyectar el siguiente mes.
 */
function calcularProyeccionTendencia(historial) {
  if (historial.length < 3) {
    return null; // Se requieren al menos 3 meses
  }

  const ultimos3 = historial.slice(-3);

  let sumaIngresos = 0;
  let sumaOcupacion = 0;

  for (let i = 0; i < ultimos3.length; i++) {
    sumaIngresos += ultimos3[i].ingresos;
    sumaOcupacion += ultimos3[i].ocupacion;
  }

  const promedioIngresos = sumaIngresos / 3;
  const promedioOcupacion = Math.max(0, Math.min(100, sumaOcupacion / 3));

  return {
    valor: Math.max(0, Math.round(promedioIngresos)),
    ocupacion: promedioOcupacion
  };
}

/**
 * Función principal de proyección.
 * Devuelve dos estimaciones separadas: Estacional y Tendencia.
 */
async function obtenerProyeccionesProximoMes() {
  try {
    const historial = await obtenerHistorialCompleto();

    // Determinar el próximo mes a proyectar
    const now = new Date();
    let mesObjetivo = now.getMonth() + 1; // Próximo mes
    let anioObjetivo = now.getFullYear();
    if (mesObjetivo > 11) {
      mesObjetivo = 0;
      anioObjetivo++;
    }

    const resultado = {
      mesProyectado: MESES_FULL[mesObjetivo],
      anioProyectado: anioObjetivo,
      estacional: null,
      tendencia: null
    };

    // Validar mínimo de datos históricos para tendencia
    if (historial.length < 3) {
      resultado.tendencia = { error: "Se requieren al menos 3 meses de datos históricos." };
      resultado.estacional = { error: "Se requieren al menos 3 meses de datos históricos." };
      return resultado;
    }

    // Algoritmo A: Crecimiento Interanual (Estacional)
    const resEstacional = calcularCrecimientoInteranual(historial, mesObjetivo, anioObjetivo);
    if (resEstacional !== null) {
      resultado.estacional = {
        valor: resEstacional.valor,
        ocupacion: resEstacional.ocupacion,
        factorCrecimiento: resEstacional.factorCrecimiento,
        error: null
      };
    } else {
      resultado.estacional = { error: "Datos insuficientes del año pasado para esta temporada." };
    }

    // Algoritmo B: Rendimiento Actual (Tendencia)
    const resTendencia = calcularProyeccionTendencia(historial);
    if (resTendencia !== null) {
      resultado.tendencia = {
        valor: resTendencia.valor,
        ocupacion: resTendencia.ocupacion,
        error: null
      };
    } else {
      resultado.tendencia = { error: "Datos insuficientes para calcular la tendencia." };
    }

    return resultado;

  } catch (e) {
    console.error("Error al obtener proyecciones:", e);
    return { errorGlobal: "Error al acceder a los datos históricos." };
  }
}

/**
 * Renderiza las tarjetas de predicción de ingresos en la interfaz.
 * Se ejecuta de forma asíncrona para no bloquear el renderizado principal.
 */
async function renderProyeccion() {
  const grid = document.getElementById("prediccion-grid");
  if (!grid) return;

  const errorEstEl = document.getElementById("prediccion-error-estacional");
  const contentEstEl = document.getElementById("prediccion-content-estacional");
  const valEstEl = document.getElementById("prediccion-valor-estacional");
  const metaEstEl = document.getElementById("prediccion-meta-estacional");
  const mesEstEl = document.getElementById("prediccion-mes-estacional");
  const ocupEstEl = document.getElementById("prediccion-ocup-estacional");
  const barraEstEl = document.getElementById("prediccion-barra-estacional");

  const errorTendEl = document.getElementById("prediccion-error-tendencia");
  const contentTendEl = document.getElementById("prediccion-content-tendencia");
  const valTendEl = document.getElementById("prediccion-valor-tendencia");
  const metaTendEl = document.getElementById("prediccion-meta-tendencia");
  const mesTendEl = document.getElementById("prediccion-mes-tendencia");
  const ocupTendEl = document.getElementById("prediccion-ocup-tendencia");
  const barraTendEl = document.getElementById("prediccion-barra-tendencia");

  // Mostrar estado de carga
  if (valEstEl) valEstEl.textContent = "Calculando…";
  if (metaEstEl) metaEstEl.textContent = "";
  if (errorEstEl) errorEstEl.classList.add("hidden");
  if (contentEstEl) contentEstEl.classList.remove("hidden");

  if (valTendEl) valTendEl.textContent = "Calculando…";
  if (metaTendEl) metaTendEl.textContent = "";
  if (errorTendEl) errorTendEl.classList.add("hidden");
  if (contentTendEl) contentTendEl.classList.remove("hidden");

  const resultado = await obtenerProyeccionesProximoMes();

  if (resultado.errorGlobal) {
    if (contentEstEl) contentEstEl.classList.add("hidden");
    if (errorEstEl) {
      errorEstEl.classList.remove("hidden");
      errorEstEl.textContent = resultado.errorGlobal;
    }
    if (contentTendEl) contentTendEl.classList.add("hidden");
    if (errorTendEl) {
      errorTendEl.classList.remove("hidden");
      errorTendEl.textContent = resultado.errorGlobal;
    }
    return;
  }

  // ── Render Estacional ──
  if (mesEstEl) mesEstEl.textContent = `${resultado.mesProyectado} ${resultado.anioProyectado}`;

  if (resultado.estacional && !resultado.estacional.error) {
    if (errorEstEl) errorEstEl.classList.add("hidden");
    if (contentEstEl) contentEstEl.classList.remove("hidden");
    if (valEstEl) valEstEl.textContent = fmt(resultado.estacional.valor);
    if (metaEstEl) {
      const pct = (resultado.estacional.factorCrecimiento * 100).toFixed(1);
      metaEstEl.textContent = `Crecimiento interanual ingresos: ${pct >= 0 ? '+' : ''}${pct}%`;
    }
    if (ocupEstEl && barraEstEl) {
      const ocupPct = resultado.estacional.ocupacion.toFixed(1);
      ocupEstEl.textContent = `${ocupPct}%`;
      barraEstEl.style.width = `${ocupPct}%`;
    }
  } else {
    if (contentEstEl) contentEstEl.classList.add("hidden");
    if (errorEstEl) {
      errorEstEl.classList.remove("hidden");
      errorEstEl.textContent = resultado.estacional ? resultado.estacional.error : "Datos insuficientes.";
    }
  }

  // ── Render Tendencia ──
  if (mesTendEl) mesTendEl.textContent = `${resultado.mesProyectado} ${resultado.anioProyectado}`;

  if (resultado.tendencia && !resultado.tendencia.error) {
    if (errorTendEl) errorTendEl.classList.add("hidden");
    if (contentTendEl) contentTendEl.classList.remove("hidden");
    if (valTendEl) valTendEl.textContent = fmt(resultado.tendencia.valor);
    if (metaTendEl) {
      metaTendEl.textContent = `Basado en media móvil de 3 meses.`;
    }
    if (ocupTendEl && barraTendEl) {
      const ocupPct = resultado.tendencia.ocupacion.toFixed(1);
      ocupTendEl.textContent = `${ocupPct}%`;
      barraTendEl.style.width = `${ocupPct}%`;
    }
  } else {
    if (contentTendEl) contentTendEl.classList.add("hidden");
    if (errorTendEl) {
      errorTendEl.classList.remove("hidden");
      errorTendEl.textContent = resultado.tendencia ? resultado.tendencia.error : "Datos insuficientes.";
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════

// ── Init ──────────────────────────────────────────────────────────────────────
function cargarAnio() {
  mostrarLoader(true);
  mostrarApp(false);

  try {
    const allData = JSON.parse(localStorage.getItem(state.storageKey) || "{}");
    const raw = allData[state.anio];

    state.datos = raw ? normalizarDatos(raw) : crearDatosVacios();

    renderSelectores();
    renderDashboard();
    renderProyeccion();

    mostrarLoader(false);
    mostrarApp(true);
  } catch (e) {
    console.error("Error al cargar datos locales:", e);
    mostrarError("Error al cargar los datos guardados localmente.");
  }
}

function init() {
  // Setup UI
  setupTheme();
  setupSidebar();
  setupModals();
  setupSelectores();
  renderSelectores();
  setupMobileNav();
  setupExport();

  cargarAnio();
}

// ── Arranque ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
