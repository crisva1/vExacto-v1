/* ═══════════════════════════════════════════════════
   vExacto — app.js
   Módulos: Config · ResetDiario · Licencia · PWA ·
            Tema · Drawer · ModalConfig · Onboarding ·
            ModoSelector · Metodos · Calculadora · App
   Lógica financiera original 100% intacta.
   ═══════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   1. CONFIG
   ════════════════════════════════════════ */
const CONFIG = {
  SAL:             "aleiluisolcris*1",
  DEFAULT_BCV:     48.00,
  DEFAULT_MERCADO: 60.00,
  WS_NUMBER:       "584129050524",
  VERSION:         "1.0",
  SK: {
    LICENCIA:    '_prm',
    DEVICE_ID:   '_cid',
    BCV:         'calcu_bcv',
    MERCADO:     'calcu_binance',
    MODO:        'calcu_modo',
    ONBOARDING:  'calcu_onboarding_done',
    TEMA:        'calcu_tema',
    FECHA_TASAS: 'calcu_fecha_tasas',
  }
};

/* ════════════════════════════════════════
   2. RESET DIARIO — Tasas se limpian al
   cambiar el día (100% offline, usa el
   reloj interno del teléfono)
   ════════════════════════════════════════ */
const ResetDiario = {
  hoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },
  marcarFecha() {
    try { localStorage.setItem(CONFIG.SK.FECHA_TASAS, this.hoy()); } catch(e) {}
  },
  tasasSonDeHoy() {
    try { return localStorage.getItem(CONFIG.SK.FECHA_TASAS) === this.hoy(); } catch(e) { return false; }
  },
  limpiarTasas() {
    try {
      localStorage.removeItem(CONFIG.SK.BCV);
      localStorage.removeItem(CONFIG.SK.MERCADO);
      localStorage.removeItem(CONFIG.SK.FECHA_TASAS);
      localStorage.removeItem(CONFIG.SK.ONBOARDING);
    } catch(e) {}
  },
  verificar() {
    if (!this.tasasSonDeHoy()) this.limpiarTasas();
  }
};

/* ════════════════════════════════════════
   3. LICENCIAS
   ════════════════════════════════════════ */
const Licencia = {
  getID() {
  try {
    let id = localStorage.getItem(CONFIG.SK.DEVICE_ID);
    if (id) return id;
    const seed = [navigator.userAgent||'', screen.width+'x'+screen.height,
      navigator.language||'', (navigator.hardwareConcurrency||0)+'',
      new Date().getTimezoneOffset()+''].join('|');
    let h = 5381;
    for (let i = 0; i < seed.length; i++) h = (((h<<5)>>>0)+h+seed.charCodeAt(i))>>>0;
    id = "VZ-" + h.toString(16).toUpperCase().padStart(8,'0');
    localStorage.setItem(CONFIG.SK.DEVICE_ID, id);
    return id;
  } catch(e) {
    // Sin localStorage: genera ID desde navegador sin guardarlo
    let h = 5381;
    const seed = (navigator.userAgent||'x') + screen.width + screen.height;
    for (let i = 0; i < seed.length; i++) h = (((h<<5)>>>0)+h+seed.charCodeAt(i))>>>0;
    return "VZ-" + h.toString(16).toUpperCase().padStart(8,'0');
  }
},
  genClave(id) {
    const base = id + CONFIG.SAL;
    let h = 5381;
    for (let i = 0; i < base.length; i++) h = (((h<<5)>>>0)+h+base.charCodeAt(i))>>>0;
    return "KEY-" + h.toString(36).toUpperCase().padStart(7,'0');
  },
  estaActiva() {
    try { return localStorage.getItem(CONFIG.SK.LICENCIA) === 'true'; } catch(e) { return false; }
  },
  mostrarMuro() {
  const el = document.getElementById('mi-id-display');
  if (el) {
    // Pequeño delay para que el DOM esté listo
    setTimeout(() => {
      el.textContent = this.getID();
    }, 100);
  }
},
  pedirAcceso() {
    const n = (document.getElementById('reg-nom').value||'').trim();
    const c = (document.getElementById('reg-ci').value||'').trim();
    if (!n||!c) { this.error("Completa tu nombre y cédula primero."); return; }
    const txt = `SOLICITUD ACTIVACION\nNombre: ${n}\nCI: ${c}\nID: ${this.getID()}`;
    window.open(`https://wa.me/${CONFIG.WS_NUMBER}?text=${encodeURIComponent(txt)}`, '_blank');
  },
  activar() {
    const entrada = (document.getElementById('clave-in').value||'').trim().toUpperCase();
    if (!entrada) { this.error("Ingresa la clave de activación."); return; }
    if (entrada === this.genClave(this.getID())) {
      try { localStorage.setItem(CONFIG.SK.LICENCIA,'true'); } catch(e) {}
      App.mostrar();
    } else {
      this.error("Clave inválida. Verifica e intenta de nuevo.");
      document.getElementById('clave-in').value = '';
    }
  },
  error(txt) {
    const el = document.getElementById('msg-error');
    if (!el) return;
    el.textContent = txt;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.textContent=''; }, 4000);
  }
};

/* ════════════════════════════════════════
   4. PWA INSTALL
   ════════════════════════════════════════ */
const InstallPWA = {
  _prompt: null,
  init() {
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const instalada = window.navigator.standalone === true;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); this._prompt = e;
      const b = document.getElementById('banner-android');
      if (b) b.classList.add('visible');
    });
    window.addEventListener('appinstalled', () => {
      const b = document.getElementById('banner-android');
      if (b) b.classList.remove('visible');
    });
    if (esIOS && !instalada) {
      const b = document.getElementById('banner-ios');
      if (b) b.classList.add('visible');
    }
  },
  accion() {
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (esIOS) {
      document.getElementById('modal-ios').classList.add('activo');
    } else if (this._prompt) {
      this._prompt.prompt();
      this._prompt.userChoice.then(r => {
        if (r.outcome === 'accepted') {
          const b = document.getElementById('banner-android');
          if (b) b.classList.remove('visible');
        }
        this._prompt = null;
      });
    }
  },
  cerrarIos() { document.getElementById('modal-ios').classList.remove('activo'); }
};

/* ════════════════════════════════════════
   5. TEMA claro/oscuro — persiste en
   localStorage, se aplica antes del paint
   ════════════════════════════════════════ */
const Tema = {
  actual: 'light',
  init() {
    this.actual = localStorage.getItem(CONFIG.SK.TEMA) || 'light';
    this.aplicar(this.actual, false);
    const t = document.getElementById('toggle-dark');
    if (t) t.checked = this.actual === 'dark';
  },
  aplicar(modo, guardar = true) {
    this.actual = modo;
    document.documentElement.setAttribute('data-theme', modo);
    if (guardar) { try { localStorage.setItem(CONFIG.SK.TEMA, modo); } catch(e) {} }
    const t = document.getElementById('toggle-dark');
    if (t) t.checked = modo === 'dark';
  },
  toggle() { this.aplicar(this.actual === 'dark' ? 'light' : 'dark'); }
};

/* ════════════════════════════════════════
   6. DRAWER
   ════════════════════════════════════════ */
const Drawer = {
  open() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    // Actualizar subtítulos
    const bcv     = parseFloat(localStorage.getItem(CONFIG.SK.BCV)    || CONFIG.DEFAULT_BCV);
    const mercado = parseFloat(localStorage.getItem(CONFIG.SK.MERCADO) || CONFIG.DEFAULT_MERCADO);
    const sub = document.getElementById('drawer-tasas-sub');
    if (sub) sub.textContent = `BCV: Bs ${bcv.toFixed(2)} · Mdo: Bs ${mercado.toFixed(2)}`;
    const ms = document.getElementById('drawer-modo-sub');
    if (ms) ms.textContent = ModoSelector.modoActual === 'protected' ? 'Cobro protegido ✓' : 'Cobro BCV';
  },
  close() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }
};

/* ════════════════════════════════════════
   7. MODAL CONFIG (tasas + modo)
   ════════════════════════════════════════ */
const ModalConfig = {
  abrirTasas() {
    const bcv     = localStorage.getItem(CONFIG.SK.BCV)     || CONFIG.DEFAULT_BCV;
    const mercado = localStorage.getItem(CONFIG.SK.MERCADO)  || CONFIG.DEFAULT_MERCADO;
    const factor  = parseFloat(bcv) > 0 ? (parseFloat(mercado)/parseFloat(bcv)).toFixed(4) : '—';
    document.getElementById('modal-config-title').textContent = '📊 Tasas del día';
    document.getElementById('modal-config-body').innerHTML = `
      <div class="cfg-row">
        <div class="cfg-field">
          <div class="cfg-label">USD BCV (Bs/$)</div>
          <input class="field-input tasa" type="number" id="cfg-bcv"
            value="${parseFloat(bcv).toFixed(2)}" step="0.01" inputmode="decimal"
            oninput="ModalConfig.actualizarFactor()">
        </div>
        <div class="cfg-field">
          <div class="cfg-label">USD Mercado (Bs/$)</div>
          <input class="field-input tasa" type="number" id="cfg-mercado"
            value="${parseFloat(mercado).toFixed(2)}" step="0.01" inputmode="decimal"
            oninput="ModalConfig.actualizarFactor()">
        </div>
      </div>
      <div class="factor-row">
        <span class="factor-lbl">Protección de margen</span>
        <span class="factor-val" id="cfg-factor">${factor}</span>
      </div>
      <button class="btn btn-primary" onclick="ModalConfig.guardarTasas()">✓ Guardar tasas</button>`;
    document.getElementById('modal-config').classList.add('open');
    Drawer.close();
  },
  actualizarFactor() {
    const b = parseFloat(document.getElementById('cfg-bcv')?.value)     || 0;
    const m = parseFloat(document.getElementById('cfg-mercado')?.value)  || 0;
    const el = document.getElementById('cfg-factor');
    if (el) el.textContent = b > 0 ? (m/b).toFixed(4) : '—';
  },
  guardarTasas() {
    const b = parseFloat(document.getElementById('cfg-bcv').value)     || 0;
    const m = parseFloat(document.getElementById('cfg-mercado').value)  || 0;
    if (b <= 0 || m <= 0) { alert('Ingresa valores válidos.'); return; }
    try {
      localStorage.setItem(CONFIG.SK.BCV,      b.toString());
      localStorage.setItem(CONFIG.SK.MERCADO,   m.toString());
      localStorage.setItem(CONFIG.SK.ONBOARDING,'done');
      ResetDiario.marcarFecha();
    } catch(e) {}
    Calculadora.calc();
    this.cerrar();
    const badge = document.getElementById('savedBadge');
    if (badge) {
      badge.style.display = 'flex';
      clearTimeout(badge._t);
      badge._t = setTimeout(() => { badge.style.display='none'; }, 2500);
    }
  },
  abrirModo() {
    const actual = ModoSelector.modoActual;
    document.getElementById('modal-config-title').textContent = '🛡️ Modo de cobro';
    document.getElementById('modal-config-body').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px">
        <button class="modo-btn ${actual==='protected'?'active-prot':''}"
          onclick="ModoSelector.setModo('protected');ModalConfig.cerrar()">
          <div class="modo-btn-icon" style="background:var(--orange-soft)">🛡️</div>
          <div class="modo-btn-text">
            <div class="modo-btn-title">Cobro protegido</div>
            <div class="modo-btn-sub">Usa USD Mercado. Protege tu margen contra la brecha.</div>
          </div>
          ${actual==='protected'?'<span style="color:var(--orange);font-size:16px">✓</span>':''}
        </button>
        <button class="modo-btn ${actual==='bcv'?'active-bcv':''}"
          onclick="ModoSelector.setModo('bcv');ModalConfig.cerrar()">
          <div class="modo-btn-icon" style="background:var(--blue-soft)">🏛️</div>
          <div class="modo-btn-text">
            <div class="modo-btn-title">Cobro BCV</div>
            <div class="modo-btn-sub">Usa solo la tasa oficial BCV.</div>
          </div>
          ${actual==='bcv'?'<span style="color:var(--blue);font-size:16px">✓</span>':''}
        </button>
      </div>`;
    document.getElementById('modal-config').classList.add('open');
    Drawer.close();
  },
  cerrar() { document.getElementById('modal-config').classList.remove('open'); }
};

/* ════════════════════════════════════════
   8. ONBOARDING
   ════════════════════════════════════════ */
const Onboarding = {
  estaCompleto() {
    try { return localStorage.getItem(CONFIG.SK.ONBOARDING) === 'done'; } catch(e) { return false; }
  },
  mostrar() {
    const bcv     = localStorage.getItem(CONFIG.SK.BCV)     || CONFIG.DEFAULT_BCV;
    const mercado = localStorage.getItem(CONFIG.SK.MERCADO)  || CONFIG.DEFAULT_MERCADO;
    document.getElementById('ob-bcv').value     = parseFloat(bcv).toFixed(2);
    document.getElementById('ob-mercado').value = parseFloat(mercado).toFixed(2);
    document.getElementById('screen-onboarding').classList.add('visible');
  },
  confirmar() {
    const b = parseFloat(document.getElementById('ob-bcv').value)     || 0;
    const m = parseFloat(document.getElementById('ob-mercado').value)  || 0;
    if (b <= 0 || m <= 0) { alert('Ingresa las tasas del día para continuar.'); return; }
    try {
      localStorage.setItem(CONFIG.SK.BCV,       b.toString());
      localStorage.setItem(CONFIG.SK.MERCADO,    m.toString());
      localStorage.setItem(CONFIG.SK.ONBOARDING, 'done');
      ResetDiario.marcarFecha();
    } catch(e) {}
    document.getElementById('screen-onboarding').classList.remove('visible');
    Calculadora.calc();
  }
};

/* ════════════════════════════════════════
   9. MODO DE COBRO
   ════════════════════════════════════════ */
const ModoSelector = {
  modoActual: 'protected',
  init() {
    try { const s = localStorage.getItem(CONFIG.SK.MODO); if (s) this.modoActual = s; } catch(e) {}
    this.actualizarPill();
  },
  setModo(modo) {
    this.modoActual = modo;
    try { localStorage.setItem(CONFIG.SK.MODO, modo); } catch(e) {}
    this.actualizarPill();
    Calculadora.calc();
  },
  actualizarPill() {
    const pill = document.getElementById('mode-pill');
    const txt  = document.getElementById('mode-pill-txt');
    if (!pill||!txt) return;
    if (this.modoActual === 'protected') {
      pill.className = 'mode-pill protected'; txt.textContent = 'PROTEGIDO';
    } else {
      pill.className = 'mode-pill bcv'; txt.textContent = 'TASA BCV';
    }
  }
};

/* ════════════════════════════════════════
   10. MÉTODOS DE PAGO — sistema dinámico
   Cada fila tiene: selector + monto + botón X
   Internamente alimenta abonoBS o abonoUSD
   según el método seleccionado.
   ════════════════════════════════════════ */

// Definición de métodos disponibles
const METODOS = {
  bs: [
    { value: 'pago_movil',    label: '📱 Pago móvil' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'tarjeta',       label: '💳 Tarjeta' },
    { value: 'efectivo_bs',   label: '💵 Efectivo Bs' },
  ],
  usd: [
    { value: 'efectivo_usd', label: '💵 USD Efectivo' },
    { value: 'binance',      label: '🟡 Binance' },
    { value: 'usdt',         label: '💠 USDT' },
    { value: 'zelle',        label: '💜 Zelle' },
  ]
};

// Todos los métodos con su moneda
const METODO_MAP = {};
METODOS.bs.forEach(m  => { METODO_MAP[m.value] = 'bs'; });
METODOS.usd.forEach(m => { METODO_MAP[m.value] = 'usd'; });

let _filaId = 0; // contador único para cada fila

const Metodos = {

  /* Agrega una nueva fila de método de pago */
  agregar() {
    const id = ++_filaId;
    const wrap = document.getElementById('metodos-wrap');
    if (!wrap) return;

    // Construir opciones del select
    let opcionesBs  = METODOS.bs.map(m  => `<option value="${m.value}">${m.label}</option>`).join('');
    let opcionesUsd = METODOS.usd.map(m => `<option value="${m.value}">${m.label}</option>`).join('');

    const fila = document.createElement('div');
    fila.className = 'metodo-fila';
    fila.id = `fila-${id}`;
    fila.innerHTML = `
      <span class="metodo-badge bs" id="badge-${id}">Bs</span>
      <select class="metodo-select" id="sel-${id}"
        onchange="Metodos.onCambioMetodo(${id})">
        <optgroup label="── Bolívares ──">${opcionesBs}</optgroup>
        <optgroup label="── Dólares ──">${opcionesUsd}</optgroup>
      </select>
      <input class="metodo-monto" type="number" id="monto-${id}"
        placeholder="0.00" inputmode="decimal" step="0.01"
        oninput="Calculadora.calc()">
      <button class="metodo-del" onclick="Metodos.eliminar(${id})" title="Eliminar">🗑</button>
    `;
    wrap.appendChild(fila);

    // Foco en el campo de monto
    setTimeout(() => {
      const input = document.getElementById(`monto-${id}`);
      if (input) input.focus();
    }, 100);

    Calculadora.calc();
  },

  /* Cuando cambia el selector, actualiza el badge de moneda */
  onCambioMetodo(id) {
    const sel   = document.getElementById(`sel-${id}`);
    const badge = document.getElementById(`badge-${id}`);
    if (!sel || !badge) return;
    const moneda = METODO_MAP[sel.value] || 'bs';
    if (moneda === 'usd') {
      badge.textContent = '$';
      badge.className = 'metodo-badge usd';
    } else {
      badge.textContent = 'Bs';
      badge.className = 'metodo-badge bs';
    }
    Calculadora.calc();
  },

  /* Elimina una fila con animación de salida */
  eliminar(id) {
    const fila = document.getElementById(`fila-${id}`);
    if (!fila) return;
    fila.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    fila.style.opacity = '0';
    fila.style.transform = 'translateX(8px)';
    setTimeout(() => { fila.remove(); Calculadora.calc(); }, 180);
  },

  /* Recolecta todos los abonos actuales y los suma por moneda
     Retorna { abonoBS: number, abonoUSD: number } */
  getAbonos() {
    let abonoBS  = 0;
    let abonoUSD = 0;
    const wrap = document.getElementById('metodos-wrap');
    if (!wrap) return { abonoBS, abonoUSD };

    wrap.querySelectorAll('.metodo-fila').forEach(fila => {
      const idMatch = fila.id.match(/fila-(\d+)/);
      if (!idMatch) return;
      const id     = idMatch[1];
      const sel    = document.getElementById(`sel-${id}`);
      const input  = document.getElementById(`monto-${id}`);
      if (!sel || !input) return;
      const val    = parseFloat(input.value) || 0;
      const moneda = METODO_MAP[sel.value] || 'bs';
      if (moneda === 'usd') abonoUSD += val;
      else                  abonoBS  += val;
    });

    return { abonoBS, abonoUSD };
  },

  /* Limpia todas las filas */
  limpiar() {
    const wrap = document.getElementById('metodos-wrap');
    if (wrap) wrap.innerHTML = '';
  }
};

/* ════════════════════════════════════════
   11. CALCULADORA — Lógica financiera
   ORIGINAL INTACTA. No se modifican
   fórmulas. Solo se leen los abonos
   desde el módulo Metodos.
   ════════════════════════════════════════ */
const Calculadora = {

  fmt(n) {
    return n.toLocaleString('es-VE', { minimumFractionDigits: 2 });
  },

  /* Redondeo al medio dólar superior — ORIGINAL
     2.00→2.00 | 2.01→2.50 | 2.51→3.00 */
  redondearUSD(n) {
  return Math.round(n * 100) / 100;
},

  setVal(id, txt) {
    const el = document.getElementById(id);
    if (el) { el.textContent = txt; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  },

calc() {
    var bcv = parseFloat(localStorage.getItem(CONFIG.SK.BCV)) || CONFIG.DEFAULT_BCV;
    var mercado = parseFloat(localStorage.getItem(CONFIG.SK.MERCADO)) || CONFIG.DEFAULT_MERCADO;
    var loyEl = document.getElementById('loyverse');
    var loy = loyEl ? (parseFloat(loyEl.value) || 0) : 0; // Ejemplo: $20 base
    
    var abonos = Metodos.getAbonos();
    var abonoBS = abonos.abonoBS;   // Ejemplo: 5000 Bs
    var abonoUSD = abonos.abonoUSD; // Ejemplo: El billete que entrega
    
    var factor = bcv > 0 ? mercado / bcv : 1;
    var tasaEfectiva = ModoSelector.modoActual === 'protected' ? factor : 1;
    
    // 1. PRECIOS INICIALES DE REFERENCIA
    var precioEnBs = loy * bcv; // Ejemplo: $20 * 530 = 10,600 Bs (SI O SI FIJO)
    var especial = tasaEfectiva > 0 ? loy / tasaEfectiva : 0; // Precio inflado en $
    
    Calculadora.setVal('precioBs', 'Bs ' + Calculadora.fmt(precioEnBs));
    Calculadora.setVal('precioEspecial', '$' + especial.toFixed(2));

    // 2. MATEMÁTICA ESTRICTA PARA "POR COBRAR BOLÍVARES" (PROTECCIÓN DE CAJA)
    var abonoUSDenBsMercado = abonoUSD * mercado;
    var cobrarBS = precioEnBs - abonoBS - abonoUSDenBsMercado;
    cobrarBS = Math.max(0, cobrarBS); // Evita números negativos en pantalla

    // 3. MATEMÁTICA ESTRICTA PARA "POR COBRAR DÓLARES" (PAGO EN DIVISAS SIN BRECHA)
    var deudaRestanteEnBs = precioEnBs - abonoBS; 
    var saldoRealPorCobrarUSD = deudaRestanteEnBs > 0 ? (deudaRestanteEnBs / mercado) : 0;

    var cobrarUSD = 0;
    var vueltoTotalEnUSD = 0;

    if (abonoUSD > saldoRealPorCobrarUSD) {
        vueltoTotalEnUSD = abonoUSD - saldoRealPorCobrarUSD;
        cobrarUSD = 0;
    } else {
        vueltoTotalEnUSD = 0;
        cobrarUSD = saldoRealPorCobrarUSD - abonoUSD;
    }

    // 4. ENVIAR DATOS A LA INTERFAZ VISUAL
    Calculadora.actualizarEstado(loy, cobrarBS, cobrarUSD, bcv, mercado, abonoBS, abonoUSD, vueltoTotalEnUSD);

    // Mostrar en los campos de "Por Cobrar" de tu HTML
    Calculadora.setVal('cobrarBS', Calculadora.fmt(cobrarBS));
    Calculadora.setVal('cobrarUSD', cobrarUSD.toFixed(2));
},

abrirHistorialPanel() {
    if (typeof cerrarDrawer === "function") cerrarDrawer();
    var panel = document.getElementById('historial-panel');
    if (panel) panel.style.display = 'block';
    this.renderizarHistorial();
},

cerrarHistorialPanel() {
    var panel = document.getElementById('historial-panel');
    if (panel) panel.style.display = 'none';
},

renderizarHistorial() {
    var historial = JSON.parse(localStorage.getItem('vexacto_historial')) || [];
    var listaContainer = document.getElementById('historial-lista-container');
    var txtTotalUSD = document.getElementById('hist-total-usd');
    var txtContador = document.getElementById('hist-contador');
    var txtFecha = document.getElementById('hist-fecha-dia');
    var txtEfectivo = document.getElementById('hist-efectivo-real');
    var txtDigital = document.getElementById('hist-digital-real');

    if (!listaContainer) return;

    if (txtFecha) txtFecha.textContent = "Caja del día: " + new Date().toLocaleDateString('es-VE');

    var totalFacturadoUSD = 0;
    var totalEfectivoUSD = 0;
    var totalDigitalUSD = 0;

    listaContainer.innerHTML = "";
    if (txtContador) txtContador.textContent = historial.length + " cobros";

    if (historial.length === 0) {
        listaContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-dim); font-size:14px;">No hay cobros registrados el día de hoy.</div>`;
        if (txtTotalUSD) txtTotalUSD.textContent = "$0.00";
        if (txtEfectivo) txtEfectivo.textContent = "$0.00";
        if (txtDigital) txtDigital.textContent = "$0.00";
        return;
    }

    historial.forEach((venta, index) => {
        totalFacturadoUSD += parseFloat(venta.montoFacturadoUSD || 0);

        var efectivoUSDRecibido = parseFloat(venta.ingresos?.efectivoUSD || 0);
        var vueltoUSD_Entregado = parseFloat(venta.vueltos?.medioUSD === "efectivo_usd" ? (venta.vueltos?.montoUSD || 0) : 0);
        
        var efectivoNetoDeEstaVenta = efectivoUSDRecibido - vueltoUSD_Entregado;
        totalEfectivoUSD += efectivoNetoDeEstaVenta;

        var totalPagadoEnUSD = efectivoUSDRecibido + (parseFloat(venta.ingresos?.bolivares || 0) / (venta.tasaBCV || 1));
        var vueltoTotalDescontadoUSD = parseFloat(venta.vueltos?.montoUSD || 0) + (parseFloat(venta.vueltos?.montoBS || 0) / (venta.tasaBCV || 1));
        var netoVentaUSD = totalPagadoEnUSD - vueltoTotalDescontadoUSD;
        
        totalDigitalUSD += (netoVentaUSD - efectivoNetoDeEstaVenta);

        var itemDiv = document.createElement('div');
        itemDiv.className = 'hist-item-card';
        
        var horaLimpia = venta.fecha ? (venta.fecha.split(', ')[1] || venta.fecha) : "--:--";

        itemDiv.innerHTML = `
            <div class="hist-header-row" onclick="Calculadora.toggleDetalleHistorial(${index})">
                <div>
                    <span style="font-weight:600; font-size:14px; color:var(--text); display:block;">Venta #${index + 1}</span>
                    <span style="font-size:12px; color:var(--text-muted);">${horaLimpia}</span>
                </div>
                <div style="text-align:right;">
                    <span style="font-family:var(--font-num); font-weight:700; color:var(--green); font-size:15px;">+$${venta.montoFacturadoUSD.toFixed(2)}</span>
                    <span style="display:block; font-size:11px; color:var(--text-dim);">Ver detalles ›</span>
                </div>
            </div>
            <div id="hist-detalle-${index}" class="hist-detalles-desplegable" style="display:none;">
                <div>• <strong>Tasa BCV:</strong> Bs ${venta.tasaBCV} | <strong>Mercado:</strong> Bs ${venta.tasaMercado}</div>
                <div>• <strong>Abonado USD:</strong> $${efectivoUSDRecibido.toFixed(2)}</div>
                <div>• <strong>Abonado Bs:</strong> Bs ${this.fmt(venta.ingresos?.bolivares || 0)}</div>
                <div style="color:var(--gold); font-weight:600;">• <strong>Vuelto USD:</strong> $${parseFloat(venta.vueltos?.montoUSD || 0).toFixed(2)} (${venta.vueltos?.medioUSD})</div>
                <div style="color:var(--gold); font-weight:600;">• <strong>Vuelto Bs:</strong> Bs ${this.fmt(venta.vueltos?.montoBS || 0)} (${venta.vueltos?.medioBS})</div>
            </div>
        `;
        listaContainer.appendChild(itemDiv);
    });

    if (txtTotalUSD) txtTotalUSD.textContent = "$" + totalFacturadoUSD.toFixed(2);
    if (txtEfectivo) txtEfectivo.textContent = "$" + totalEfectivoUSD.toFixed(2);
    
    var currentBCV = parseFloat(localStorage.getItem(CONFIG.SK.BCV)) || CONFIG.DEFAULT_BCV;
    var totalDigitalEnBs = totalDigitalUSD * currentBCV;
    if (txtDigital) txtDigital.textContent = "Bs " + this.fmt(Math.max(0, totalDigitalEnBs));
},

toggleDetalleHistorial(idx) {
    var el = document.getElementById('hist-detalle-' + idx);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
},

exportarHistorial() {
    var historial = JSON.parse(localStorage.getItem('vexacto_historial')) || [];
    if(historial.length === 0) return alert("No hay datos para exportar.");
    
    var textoReporte = "REPORTE DE COBROS VEXACTO\n=========================\n\n";
    historial.forEach((v, i) => {
        textoReporte += `VENTA #${i+1} - Horario: ${v.fecha}\n`;
        textoReporte += `Monto Base: $${v.montoFacturadoUSD.toFixed(2)}\n`;
        textoReporte += `Ingresos: $${v.ingresos?.efectivoUSD} | Bs ${v.ingresos?.bolivares}\n`;
        textoReporte += `Vueltos: $${v.vueltos?.montoUSD} (${v.vueltos?.medioUSD}) | Bs ${v.vueltos?.montoBS} (${v.vueltos?.medioBS})\n`;
        textoReporte += `-----------------------------------------\n`;
    });
    
    var blob = new Blob([textoReporte], { type: "text/plain;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Cierre_Caja_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
},

resetCajaDiaria() {
    if (confirm("¿Estás seguro de que deseas archivar y borrar los cobros de hoy? Esto dejará la caja en cero.")) {
        localStorage.removeItem('vexacto_historial');
        alert("Caja reiniciada con éxito.");
        this.renderizarHistorial();
    }
},



actualizarEstado(loy, cobrarBS, cobrarUSD, bcv, mercado, abonoBS, abonoUSD, vueltoTotalEnUSD) {
    var statusEl = document.getElementById('resumen-status');
    var vueltoSec = document.getElementById('vuelto-section');
    var vueltoAmt = document.getElementById('vuelto-amount');
    
    // Traer los nuevos elementos del botón y los selectores ocultos
    var btnCerrar = document.getElementById('btn-cerrar-venta');
    var optVueltoUSD = document.getElementById('vuelto-opcion-usd');
    var optVueltoBS = document.getElementById('vuelto-opcion-bs');

    if (!statusEl) return;

    if (loy <= 0) {
        statusEl.textContent = 'Ingresa un monto';
        statusEl.className = 'resumen-status vacio';
        if (vueltoSec) vueltoSec.style.display = 'none';
        if (btnCerrar) {
            btnCerrar.disabled = true;
            btnCerrar.style.backgroundColor = '#333';
            btnCerrar.style.color = '#777';
            btnCerrar.style.cursor = 'not-allowed';
        }
        return;
    }

    // Si no se ha registrado ningún pago todavía
    if (abonoBS === 0 && abonoUSD === 0) {
        if (vueltoSec) vueltoSec.style.display = 'none';
        if (optVueltoUSD) optVueltoUSD.style.display = 'none';
        if (optVueltoBS) optVueltoBS.style.display = 'none';
        
        statusEl.textContent = 'Pendiente';
        statusEl.className = 'resumen-status pendiente';
        
        if (btnCerrar) {
            btnCerrar.disabled = true;
            btnCerrar.style.backgroundColor = '#333';
            btnCerrar.style.color = '#777';
            btnCerrar.style.cursor = 'not-allowed';
        }
        return;
    }

    // LÓGICA DE VUELTO MIXTO (Dólares enteros + Fracción a BCV)
    if (vueltoTotalEnUSD > 0.009) {
        if (vueltoSec) vueltoSec.style.display = 'block';

var vueltoUSD = Math.floor(vueltoTotalEnUSD); // Billetes de $1, $5 enteros
var centavosUSD = vueltoTotalEnUSD - vueltoUSD; // Fracción decimal sobrante
var vueltoBS = parseFloat((centavosUSD * bcv).toFixed(2)); // <--- CORREGIDO A 2 DECIMALES


        var hayVueltoUSD = vueltoUSD >= 1;
        var hayVueltoBS = vueltoBS > 0.05;

        if (optVueltoUSD) optVueltoUSD.style.display = hayVueltoUSD ? 'block' : 'none';
        if (optVueltoBS) optVueltoBS.style.display = hayVueltoBS ? 'block' : 'none';

        var lineas = '';
        if (hayVueltoUSD) {
            lineas += '<div class="vuelto-linea usd">USD <span>$' + vueltoUSD.toFixed(0) + '.00</span></div>';
        }
        if (hayVueltoUSD && hayVueltoBS) {
            lineas += '<div class="vuelto-mas">+</div>';
        }
        if (hayVueltoBS) {
            lineas += '<div class="vuelto-linea bs">Bs <span>' + Calculadora.fmt(vueltoBS) + '</span></div>';
        }

        if (vueltoAmt) vueltoAmt.innerHTML = lineas;
        statusEl.textContent = '↩ Dar vuelto';
        statusEl.className = 'resumen-status vuelto';

        // Habilitar botón de cierre en COLOR VERDE para dar vuelto
        if (btnCerrar) {
            btnCerrar.disabled = false;
            btnCerrar.style.backgroundColor = '#28a745'; 
            btnCerrar.style.color = '#fff';
            btnCerrar.style.cursor = 'pointer';
        }
    } 
    // Si la deuda ya se cubrió por completo sin dejar vueltos significativos
    else if (cobrarBS < 0.1 && cobrarUSD < 0.01) {
        if (vueltoSec) vueltoSec.style.display = 'none';
        if (optVueltoUSD) optVueltoUSD.style.display = 'none';
        if (optVueltoBS) optVueltoBS.style.display = 'none';
        
        statusEl.textContent = '✓ Cobro completo';
        statusEl.className = 'resumen-status completo';

        // Habilitar botón de cierre en COLOR AZUL para cobro exacto
        if (btnCerrar) {
            btnCerrar.disabled = false;
            btnCerrar.style.backgroundColor = '#007bff'; 
            btnCerrar.style.color = '#fff';
            btnCerrar.style.cursor = 'pointer';
        }
    } 
    // Si todavía queda dinero pendiente por abonar
    else {
        if (vueltoSec) vueltoSec.style.display = 'none';
        if (optVueltoUSD) optVueltoUSD.style.display = 'none';
        if (optVueltoBS) optVueltoBS.style.display = 'none';

        statusEl.textContent = 'Pendiente';
        statusEl.className = 'resumen-status pendiente';

        // Bloquear botón si el cobro sigue incompleto
        if (btnCerrar) {
            btnCerrar.disabled = true;
            btnCerrar.style.backgroundColor = '#333';
            btnCerrar.style.color = '#777';
            btnCerrar.style.cursor = 'not-allowed';
        }
    }
},
procesarCierreVenta() {
    var bcv = parseFloat(localStorage.getItem(CONFIG.SK.BCV)) || CONFIG.DEFAULT_BCV;
    var mercado = parseFloat(localStorage.getItem(CONFIG.SK.MERCADO)) || CONFIG.DEFAULT_MERCADO;
    var loyEl = document.getElementById('loyverse');
    var loy = loyEl ? (parseFloat(loyEl.value) || 0) : 0; // El $20 base de vitrina

    // Captura exacta de los abonos reales que introdujo el cajero
    var abonoUSD = parseFloat(document.getElementById('abono-usd')?.value) || 0;
    var abonoBS = parseFloat(document.getElementById('abono-bs')?.value) || 0;
    
    // 1. RECALCULAR LAS DOS ESCALAS PARA EL HISTORIAL
    var precioEnBs = loy * bcv; // Los 10.600 Bs fijos legales
    
    // Calcular el saldo restante real en dólares usando la tasa de mercado (desinflado)
    var deudaRestanteEnBs = precioEnBs - abonoBS; 
    var saldoRealPorCobrarUSD = deudaRestanteEnBs > 0 ? (deudaRestanteEnBs / mercado) : 0;

    var vueltoTotalEnUSD = 0;
    if (abonoUSD > saldoRealPorCobrarUSD) {
        vueltoTotalEnUSD = abonoUSD - saldoRealPorCobrarUSD;
    }

    var vueltoUSD = 0;
    var vueltoBS = 0;
    var medioVueltoUSD = "N/A";
    var medioVueltoBS = "N/A";

    // 2. DESGLOSAR EL VUELTO MIXTO AUDITADO
    if (vueltoTotalEnUSD > 0.009) {
        vueltoUSD = Math.floor(vueltoTotalEnUSD); // Billetes enteros de $
        var centavosUSD = vueltoTotalEnUSD - vueltoUSD; // Fracción decimal
        vueltoBS = parseFloat((centavosUSD * bcv).toFixed(2)); // Centavos pasados a Bs por BCV

        // Leer qué métodos seleccionó el cajero en el HTML
        if (vueltoUSD >= 1) {
            var sUSD = document.getElementById('vuelto-medio-usd');
            medioVueltoUSD = sUSD ? sUSD.options[sUSD.selectedIndex].text : "Efectivo USD";
        }
        if (vueltoBS > 0.05) {
            var sBS = document.getElementById('vuelto-medio-bs');
            medioVueltoBS = sBS ? sBS.options[sBS.selectedIndex].text : "Pago Móvil";
        }
    }

    // 3. CREAR EL OBJETO DE AUDITORÍA PERFECTA
    var nuevaVentaLog = {
        id: "V-" + Date.now(),
        fecha: new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
        montoFacturadoUSD: loy, // El precio de vitrina ($20)
        tasaBCV: bcv,
        tasaMercado: mercado,
        ingresos: {
            efectivoUSD: abonoUSD,
            bolivares: abonoBS
        },
        vueltos: {
            montoUSD: vueltoUSD,
            medioUSD: medioVueltoUSD,
            montoBS: vueltoBS,
            medioBS: medioVueltoBS
        }
    };

    // 4. PERSISTENCIA EN EL HISTORIAL LOCAL
    var historial = JSON.parse(localStorage.getItem('vexacto_historial')) || [];
    historial.push(nuevaVentaLog);
    localStorage.setItem('vexacto_historial', JSON.stringify(historial));

    alert("¡Cobro procesado con éxito y registrado en el historial!");
    
    // 5. REINICIAR CALCULADORA
    if (typeof this.nuevaVenta === 'function') this.nuevaVenta();
    else if (typeof Calculadora.nuevaVenta === 'function') Calculadora.nuevaVenta();
},



 nuevaVenta() {
  document.getElementById('loyverse').value = '';
  const vs = document.getElementById('vuelto-section');
  if (vs) vs.style.display = 'none';  // ← agrega esta línea
  Metodos.limpiar();
  this.calc();
  document.getElementById('loyverse').focus();
}
};

/* ════════════════════════════════════════
   12. APP
   ════════════════════════════════════════ */
const App = {
  mostrar() {
    const b = document.getElementById('bloqueo-inicial');
    if (b) b.parentNode.removeChild(b);
    document.getElementById('muro-bloqueo').style.cssText = 'display:none!important';
    document.getElementById('app-content').style.cssText  = 'display:block!important';

    Tema.init();
    ModoSelector.init();
    ResetDiario.verificar();

    if (!Onboarding.estaCompleto()) {
      Onboarding.mostrar();
    } else {
      Calculadora.calc();
    }
  },
  verificar() {
    if (Licencia.estaActiva()) this.mostrar();
    else Licencia.mostrarMuro();
  }
};

/* ════════════════════════════════════════
   FUNCIONES GLOBALES (onclick en HTML)
   ════════════════════════════════════════ */
function pedirAcceso()       { Licencia.pedirAcceso(); }
function activar()           { Licencia.activar(); }
function accionInstalar()    { InstallPWA.accion(); }
function cerrarModalIos()    { InstallPWA.cerrarIos(); }
function confirmarOnboarding(){ Onboarding.confirmar(); }
function abrirDrawer()       { Drawer.open(); }
function cerrarDrawer()      { Drawer.close(); }
function abrirConfigTasas()  { ModalConfig.abrirTasas(); }
function abrirSelectorModo() { ModalConfig.abrirModo(); }
function cerrarModalConfig() { ModalConfig.cerrar(); }
function toggleTema()        { Tema.toggle(); }
function calc()              { Calculadora.calc(); }
function nuevaVenta()        { Calculadora.nuevaVenta(); }
function agregarMetodo()     { Metodos.agregar(); }
function irSoporte() {
  Drawer.close();
  window.open(`https://wa.me/${CONFIG.WS_NUMBER}?text=${encodeURIComponent('Hola, necesito soporte con vExacto')}`, '_blank');
}
function mostrarAcercaDe() {
  Drawer.close();
  alert(`vExacto v${CONFIG.VERSION}\nCobros inteligentes Bs/USD\n\nDesarrollado para comerciantes venezolanos.\n\nID: ${Licencia.getID()}`);
}

/* ════════════════════════════════════════
   ARRANQUE
   ════════════════════════════════════════ */
let _listo = false;
function _arrancar() {
  if (_listo) return; _listo = true;
  InstallPWA.init();
  App.verificar();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _arrancar);
else _arrancar();
window.addEventListener('load', _arrancar);

// Auto-actualización del Service Worker
// Cuando hay nueva versión en GitHub, se activa sola sin que el usuario haga nada
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
