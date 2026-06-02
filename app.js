/* ═══════════════════════════════════════════════════
   vExacto — app.js
   Módulos: Config · ResetDiario · Licencia · PWA ·
            Tema · Drawer · ModalConfig · Onboarding ·
            ModoSelector · Metodos · Calculadora · App
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
   2. RESET DIARIO
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
      setTimeout(() => { el.textContent = this.getID(); }, 100);
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
   5. TEMA
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
   7. MODAL CONFIG
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
   10. MÉTODOS DE PAGO
   ════════════════════════════════════════ */
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

const METODO_MAP = {};
METODOS.bs.forEach(m  => { METODO_MAP[m.value] = 'bs'; });
METODOS.usd.forEach(m => { METODO_MAP[m.value] = 'usd'; });

// Métodos que se consideran "efectivo físico"
const METODOS_EFECTIVO_USD = ['efectivo_usd'];
const METODOS_EFECTIVO_BS  = ['efectivo_bs'];
// Métodos digitales USD: Zelle, Binance, USDT
const METODOS_DIGITAL_USD  = ['zelle', 'binance', 'usdt'];
// Métodos digitales Bs: Pago móvil, Transferencia, Tarjeta
const METODOS_DIGITAL_BS   = ['pago_movil', 'transferencia', 'tarjeta'];

let _filaId = 0;

const Metodos = {
  agregar() {
    const id = ++_filaId;
    const wrap = document.getElementById('metodos-wrap');
    if (!wrap) return;

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

    setTimeout(() => {
      const input = document.getElementById(`monto-${id}`);
      if (input) input.focus();
    }, 100);

    Calculadora.calc();
  },

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

  eliminar(id) {
    const fila = document.getElementById(`fila-${id}`);
    if (!fila) return;
    fila.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    fila.style.opacity = '0';
    fila.style.transform = 'translateX(8px)';
    setTimeout(() => { fila.remove(); Calculadora.calc(); }, 180);
  },

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

  /* Devuelve el detalle completo de cada pago con su método específico */
  getDetallePagos() {
    const pagos = [];
    const wrap = document.getElementById('metodos-wrap');
    if (!wrap) return pagos;

    wrap.querySelectorAll('.metodo-fila').forEach(fila => {
      const idMatch = fila.id.match(/fila-(\d+)/);
      if (!idMatch) return;
      const id     = idMatch[1];
      const sel    = document.getElementById(`sel-${id}`);
      const input  = document.getElementById(`monto-${id}`);
      if (!sel || !input) return;
      const val    = parseFloat(input.value) || 0;
      if (val <= 0) return;
      const metodoVal = sel.value;
      const moneda    = METODO_MAP[metodoVal] || 'bs';
      // Buscar el label del método
      const allMetodos = [...METODOS.bs, ...METODOS.usd];
      const metodoInfo = allMetodos.find(m => m.value === metodoVal);
      pagos.push({
        metodo: metodoVal,
        label:  metodoInfo ? metodoInfo.label : metodoVal,
        moneda: moneda,
        monto:  val
      });
    });

    return pagos;
  },

  limpiar() {
    const wrap = document.getElementById('metodos-wrap');
    if (wrap) wrap.innerHTML = '';
  }
};

/* ════════════════════════════════════════
   11. CALCULADORA
   ════════════════════════════════════════ */
const Calculadora = {

  fmt(n) {
    return n.toLocaleString('es-VE', { minimumFractionDigits: 2 });
  },

  redondearUSD(n) {
    return Math.round(n * 100) / 100;
  },

  setVal(id, txt) {
    const el = document.getElementById(id);
    if (el) { el.textContent = txt; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  },

  calc() {
    var bcv     = parseFloat(localStorage.getItem(CONFIG.SK.BCV))     || CONFIG.DEFAULT_BCV;
    var mercado = parseFloat(localStorage.getItem(CONFIG.SK.MERCADO)) || CONFIG.DEFAULT_MERCADO;
    var loyEl   = document.getElementById('loyverse');
    var loy     = loyEl ? (parseFloat(loyEl.value) || 0) : 0;

    var abonos   = Metodos.getAbonos();
    var abonoBS  = abonos.abonoBS;
    var abonoUSD = abonos.abonoUSD;

    var factor        = bcv > 0 ? mercado / bcv : 1;
    var tasaEfectiva  = ModoSelector.modoActual === 'protected' ? factor : 1;

    var precioEnBs   = loy * bcv;
    var especial     = tasaEfectiva > 0 ? loy / tasaEfectiva : 0;

    Calculadora.setVal('precioBs',      'Bs ' + Calculadora.fmt(precioEnBs));
    Calculadora.setVal('precioEspecial','$'   + especial.toFixed(2));

    var abonoUSDenBsMercado = abonoUSD * mercado;
    var cobrarBS = precioEnBs - abonoBS - abonoUSDenBsMercado;
    cobrarBS = Math.max(0, cobrarBS);

    var deudaRestanteEnBs      = precioEnBs - abonoBS;
    var saldoRealPorCobrarUSD  = deudaRestanteEnBs > 0 ? (deudaRestanteEnBs / mercado) : 0;

    var cobrarUSD        = 0;
    var vueltoTotalEnUSD = 0;

    if (abonoUSD > saldoRealPorCobrarUSD) {
      vueltoTotalEnUSD = abonoUSD - saldoRealPorCobrarUSD;
      cobrarUSD = 0;
    } else {
      vueltoTotalEnUSD = 0;
      cobrarUSD = saldoRealPorCobrarUSD - abonoUSD;
    }

    Calculadora.actualizarEstado(loy, cobrarBS, cobrarUSD, bcv, mercado, abonoBS, abonoUSD, vueltoTotalEnUSD);
    Calculadora.setVal('cobrarBS',  Calculadora.fmt(cobrarBS));
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

  /* ── HISTORIAL REESCRITO ────────────────────────────────────────
     4 cubetas puras: Efectivo USD · Digital USD · Efectivo Bs · Digital Bs
     Totales separados por moneda al final.
     Detalle simplificado: hora + métodos recibidos (sin vueltos).
  ─────────────────────────────────────────────────────────────── */
  renderizarHistorial() {
    var historial      = JSON.parse(localStorage.getItem('vexacto_historial')) || [];
    var listaContainer = document.getElementById('historial-lista-container');
    var txtTotalUSD    = document.getElementById('hist-total-usd');
    var txtContador    = document.getElementById('hist-contador');
    var txtFecha       = document.getElementById('hist-fecha-dia');
    var txtEfecUSD     = document.getElementById('hist-efectivo-real');      // 💵 Efectivo USD
    var txtDigiUSD     = document.getElementById('hist-digital-usd');        // 💜 Digital USD
    var txtEfecBS      = document.getElementById('hist-efectivo-bs');        // 💵 Efectivo Bs
    var txtDigiBS      = document.getElementById('hist-digital-real');       // 📱 Digital Bs
    var txtTotalBs     = document.getElementById('hist-total-bs');           // TOTAL Bs

    if (!listaContainer) return;

    if (txtFecha)    txtFecha.textContent    = "Caja del día: " + new Date().toLocaleDateString('es-VE');
    if (txtContador) txtContador.textContent = historial.length + " cobros";

    // ── ACUMULADORES PUROS ─────────────────────────────────────
    var totalTransUSD = 0;  // suma de precios de vitrina
    var efectivoUSD   = 0;  // 💵 USD físico neto
    var digitalUSD    = 0;  // 💜 Zelle / Binance / USDT neto
    var efectivoBS    = 0;  // 💵 Bs físico neto
    var digitalBS     = 0;  // 📱 Pago móvil / Transferencia / Tarjeta neto

    listaContainer.innerHTML = "";

    if (historial.length === 0) {
      listaContainer.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-dim);font-size:14px;">No hay cobros registrados el día de hoy.</div>`;
      if (txtTotalUSD) txtTotalUSD.textContent = "$0.00";
      if (txtEfecUSD)  txtEfecUSD.textContent  = "$0.00";
      if (txtDigiUSD)  txtDigiUSD.textContent  = "$0.00";
      if (txtEfecBS)   txtEfecBS.textContent   = "Bs 0,00";
      if (txtDigiBS)   txtDigiBS.textContent   = "Bs 0,00";
      if (txtTotalBs)  txtTotalBs.textContent  = "Bs 0,00";
      return;
    }

    historial.forEach((venta, index) => {

      // ── ACUMULACIÓN POR CUBETA ───────────────────────────────
      totalTransUSD += parseFloat(venta.montoFacturadoUSD || 0);

      // Los pagos ahora son un array con detalle por método
      var pagos = venta.pagos || [];

      pagos.forEach(function(pago) {
        var monto = parseFloat(pago.monto || 0);
        if (METODOS_EFECTIVO_USD.includes(pago.metodo)) {
          efectivoUSD += monto;
        } else if (METODOS_DIGITAL_USD.includes(pago.metodo)) {
          digitalUSD  += monto;
        } else if (METODOS_EFECTIVO_BS.includes(pago.metodo)) {
          efectivoBS  += monto;
        } else if (METODOS_DIGITAL_BS.includes(pago.metodo)) {
          digitalBS   += monto;
        }
      });

      // Descontar vueltos de sus cubetas correspondientes
      var vuelUSD = parseFloat(venta.vueltos?.montoUSD || 0);
      var vuelBS  = parseFloat(venta.vueltos?.montoBS  || 0);
      efectivoUSD -= vuelUSD;  // el vuelto USD sale de la gaveta física
      digitalBS   -= vuelBS;   // el vuelto Bs sale de la cuenta digital

      // ── TARJETA DE VENTA SIMPLIFICADA ───────────────────────
      var horaLimpia = venta.fecha
        ? (venta.fecha.split(', ')[1] || venta.fecha)
        : "--:--";

      // Construir tags de métodos recibidos
      var tagsPago = '';
      if (pagos.length > 0) {
        pagos.forEach(function(pago) {
          var esUSD = METODO_MAP[pago.metodo] === 'usd';
          var montoFmt = esUSD
            ? '$' + parseFloat(pago.monto).toFixed(2)
            : 'Bs ' + Calculadora.fmt(parseFloat(pago.monto));
          tagsPago += `<span class="hist-tag ${esUSD ? 'usd' : 'bs'}">${pago.label} ${montoFmt}</span>`;
        });
      } else {
        // Compatibilidad con ventas antiguas guardadas sin array pagos
        var efecViejoUSD = parseFloat(venta.ingresos?.efectivoUSD || 0);
        var bsViejos     = parseFloat(venta.ingresos?.bolivares   || 0);
        if (efecViejoUSD > 0) tagsPago += `<span class="hist-tag usd">💵 $${efecViejoUSD.toFixed(2)}</span>`;
        if (bsViejos > 0)     tagsPago += `<span class="hist-tag bs">📱 Bs ${Calculadora.fmt(bsViejos)}</span>`;
        if (!tagsPago)        tagsPago  = `<span class="hist-tag">—</span>`;
      }

      var itemDiv = document.createElement('div');
      itemDiv.className = 'hist-item-card';
      itemDiv.innerHTML = `
        <div class="hist-header-row" onclick="Calculadora.toggleDetalleHistorial(${index})">
          <div>
            <span style="font-weight:600;font-size:14px;color:var(--text);display:block;">Venta #${index + 1}</span>
            <span style="font-size:12px;color:var(--text-muted);">${horaLimpia}</span>
          </div>
          <div style="text-align:right;">
            <span style="font-family:var(--font-num);font-weight:700;color:var(--green);font-size:15px;">
              +$${parseFloat(venta.montoFacturadoUSD || 0).toFixed(2)}
            </span>
            <span style="display:block;font-size:11px;color:var(--text-dim);">Ver detalles ›</span>
          </div>
        </div>
        <div id="hist-detalle-${index}" class="hist-detalles-desplegable" style="display:none;">
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">${tagsPago}</div>
          <div style="font-size:11px;color:var(--text-dim);">
            BCV: Bs ${venta.tasaBCV} · Mercado: Bs ${venta.tasaMercado}
          </div>
        </div>
      `;
      listaContainer.appendChild(itemDiv);
    });

    // ── TOTALES FINALES ────────────────────────────────────────
    var totalBs = Math.max(0, efectivoBS) + Math.max(0, digitalBS);

    if (txtTotalUSD) txtTotalUSD.textContent = "$" + totalTransUSD.toFixed(2);
    if (txtEfecUSD)  txtEfecUSD.textContent  = "$" + Math.max(0, efectivoUSD).toFixed(2);
    if (txtDigiUSD)  txtDigiUSD.textContent  = "$" + Math.max(0, digitalUSD).toFixed(2);
    if (txtEfecBS)   txtEfecBS.textContent   = "Bs " + this.fmt(Math.max(0, efectivoBS));
    if (txtDigiBS)   txtDigiBS.textContent   = "Bs " + this.fmt(Math.max(0, digitalBS));
    if (txtTotalBs)  txtTotalBs.textContent  = "Bs " + this.fmt(totalBs);
  },

  toggleDetalleHistorial(idx) {
    var el = document.getElementById('hist-detalle-' + idx);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  exportarHistorial() {
    var historial = JSON.parse(localStorage.getItem('vexacto_historial')) || [];
    if (historial.length === 0) return alert("No hay datos para exportar.");

    var textoReporte = "REPORTE DE COBROS VEXACTO\n=========================\n\n";
    historial.forEach((v, i) => {
      textoReporte += `VENTA #${i+1} - ${v.fecha}\n`;
      textoReporte += `Monto: $${parseFloat(v.montoFacturadoUSD).toFixed(2)}\n`;
      var pagos = v.pagos || [];
      if (pagos.length > 0) {
        pagos.forEach(function(p) {
          var esUSD = METODO_MAP[p.metodo] === 'usd';
          textoReporte += `  · ${p.label}: ${esUSD ? '$' : 'Bs '}${parseFloat(p.monto).toFixed(2)}\n`;
        });
      } else {
        textoReporte += `  · USD: $${v.ingresos?.efectivoUSD || 0}\n`;
        textoReporte += `  · Bs: ${v.ingresos?.bolivares || 0}\n`;
      }
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
    var statusEl    = document.getElementById('resumen-status');
    var vueltoSec   = document.getElementById('vuelto-section');
    var vueltoAmt   = document.getElementById('vuelto-amount');
    var btnCerrar   = document.getElementById('btn-cerrar-venta');
    var optVueltoUSD = document.getElementById('vuelto-opcion-usd');
    var optVueltoBS  = document.getElementById('vuelto-opcion-bs');

    if (!statusEl) return;

    if (loy <= 0) {
      statusEl.textContent = 'Ingresa un monto';
      statusEl.className   = 'resumen-status vacio';
      if (vueltoSec) vueltoSec.style.display = 'none';
      if (btnCerrar) {
        btnCerrar.disabled = true;
        btnCerrar.style.backgroundColor = '#333';
        btnCerrar.style.color  = '#777';
        btnCerrar.style.cursor = 'not-allowed';
      }
      return;
    }

    if (abonoBS === 0 && abonoUSD === 0) {
      if (vueltoSec)    vueltoSec.style.display    = 'none';
      if (optVueltoUSD) optVueltoUSD.style.display = 'none';
      if (optVueltoBS)  optVueltoBS.style.display  = 'none';
      statusEl.textContent = 'Pendiente';
      statusEl.className   = 'resumen-status pendiente';
      if (btnCerrar) {
        btnCerrar.disabled = true;
        btnCerrar.style.backgroundColor = '#333';
        btnCerrar.style.color  = '#777';
        btnCerrar.style.cursor = 'not-allowed';
      }
      return;
    }

    if (vueltoTotalEnUSD > 0.009) {
      if (vueltoSec) vueltoSec.style.display = 'block';

      var vueltoUSD  = Math.floor(vueltoTotalEnUSD);
      var centavosUSD = vueltoTotalEnUSD - vueltoUSD;
      var vueltoBS   = parseFloat((centavosUSD * bcv).toFixed(2));

      var hayVueltoUSD = vueltoUSD >= 1;
      var hayVueltoBS  = vueltoBS  > 0.05;

      if (optVueltoUSD) optVueltoUSD.style.display = hayVueltoUSD ? 'block' : 'none';
      if (optVueltoBS)  optVueltoBS.style.display  = hayVueltoBS  ? 'block' : 'none';

      var lineas = '';
      if (hayVueltoUSD) lineas += `<div class="vuelto-linea usd">USD <span>$${vueltoUSD.toFixed(0)}.00</span></div>`;
      if (hayVueltoUSD && hayVueltoBS) lineas += '<div class="vuelto-mas">+</div>';
      if (hayVueltoBS)  lineas += `<div class="vuelto-linea bs">Bs <span>${Calculadora.fmt(vueltoBS)}</span></div>`;

      if (vueltoAmt) vueltoAmt.innerHTML = lineas;
      statusEl.textContent = '↩ Dar vuelto';
      statusEl.className   = 'resumen-status vuelto';

      if (btnCerrar) {
        btnCerrar.disabled = false;
        btnCerrar.style.backgroundColor = '#28a745';
        btnCerrar.style.color  = '#fff';
        btnCerrar.style.cursor = 'pointer';
      }

    } else if (cobrarBS < 0.1 && cobrarUSD < 0.01) {
      if (vueltoSec)    vueltoSec.style.display    = 'none';
      if (optVueltoUSD) optVueltoUSD.style.display = 'none';
      if (optVueltoBS)  optVueltoBS.style.display  = 'none';
      statusEl.textContent = '✓ Cobro completo';
      statusEl.className   = 'resumen-status completo';

      if (btnCerrar) {
        btnCerrar.disabled = false;
        btnCerrar.style.backgroundColor = '#007bff';
        btnCerrar.style.color  = '#fff';
        btnCerrar.style.cursor = 'pointer';
      }

    } else {
      if (vueltoSec)    vueltoSec.style.display    = 'none';
      if (optVueltoUSD) optVueltoUSD.style.display = 'none';
      if (optVueltoBS)  optVueltoBS.style.display  = 'none';
      statusEl.textContent = 'Pendiente';
      statusEl.className   = 'resumen-status pendiente';

      if (btnCerrar) {
        btnCerrar.disabled = true;
        btnCerrar.style.backgroundColor = '#333';
        btnCerrar.style.color  = '#777';
        btnCerrar.style.cursor = 'not-allowed';
      }
    }
  },

  /* ── CIERRE DE VENTA — guarda pagos con detalle por método ── */
  procesarCierreVenta() {
    var bcv     = parseFloat(localStorage.getItem(CONFIG.SK.BCV))     || CONFIG.DEFAULT_BCV;
    var mercado = parseFloat(localStorage.getItem(CONFIG.SK.MERCADO)) || CONFIG.DEFAULT_MERCADO;
    var loyEl   = document.getElementById('loyverse');
    var loy     = loyEl ? (parseFloat(loyEl.value) || 0) : 0;

    var abonos   = typeof Metodos.getAbonos === 'function' ? Metodos.getAbonos() : { abonoBS: 0, abonoUSD: 0 };
    var abonoUSD = parseFloat(abonos.abonoUSD || 0);
    var abonoBS  = parseFloat(abonos.abonoBS  || 0);

    // Detalle de pagos con método específico (nuevo)
    var detallePagos = typeof Metodos.getDetallePagos === 'function' ? Metodos.getDetallePagos() : [];

    // Recalcular vuelto
    var precioEnBs            = loy * bcv;
    var deudaRestanteEnBs     = precioEnBs - abonoBS;
    var saldoRealPorCobrarUSD = deudaRestanteEnBs > 0 ? (deudaRestanteEnBs / mercado) : 0;
    var vueltoTotalEnUSD      = abonoUSD > saldoRealPorCobrarUSD ? (abonoUSD - saldoRealPorCobrarUSD) : 0;

    var vueltoUSD      = 0;
    var vueltoBS       = 0;
    var medioVueltoUSD = "N/A";
    var medioVueltoBS  = "N/A";

    if (vueltoTotalEnUSD > 0.009) {
      vueltoUSD = Math.floor(vueltoTotalEnUSD);
      var centavosUSD = vueltoTotalEnUSD - vueltoUSD;
      vueltoBS = parseFloat((centavosUSD * bcv).toFixed(2));

      var sUSD = document.getElementById('vuelto-medio-usd');
      if (vueltoUSD >= 1 && sUSD) medioVueltoUSD = sUSD.options[sUSD.selectedIndex].text;
      else if (vueltoUSD >= 1)    medioVueltoUSD = "Efectivo USD";

      var sBS = document.getElementById('vuelto-medio-bs');
      if (vueltoBS > 0.05 && sBS) medioVueltoBS = sBS.options[sBS.selectedIndex].text;
      else if (vueltoBS > 0.05)   medioVueltoBS = "Pago Móvil";
    }

    var nuevaVentaLog = {
      id:                "V-" + Date.now(),
      fecha:             new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
      montoFacturadoUSD: loy,
      tasaBCV:           bcv,
      tasaMercado:       mercado,
      // ── NUEVO: array de pagos con detalle por método ──
      pagos: detallePagos,
      // ── compatibilidad con código anterior ──
      ingresos: {
        efectivoUSD: abonoUSD,
        bolivares:   abonoBS
      },
      vueltos: {
        montoUSD: vueltoUSD,
        medioUSD: medioVueltoUSD,
        montoBS:  vueltoBS,
        medioBS:  medioVueltoBS
      }
    };

    var historial = JSON.parse(localStorage.getItem('vexacto_historial')) || [];
    historial.push(nuevaVentaLog);
    localStorage.setItem('vexacto_historial', JSON.stringify(historial));

    alert("¡Cobro procesado con éxito y registrado en el historial!");

    if (typeof this.nuevaVenta === 'function') this.nuevaVenta();
    else if (typeof Calculadora.nuevaVenta === 'function') Calculadora.nuevaVenta();
  },

  nuevaVenta() {
    document.getElementById('loyverse').value = '';
    const vs = document.getElementById('vuelto-section');
    if (vs) vs.style.display = 'none';
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
    document.getElementById('muro-bloqueo').style.cssText  = 'display:none!important';
    document.getElementById('app-content').style.cssText   = 'display:block!important';

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
   FUNCIONES GLOBALES
   ════════════════════════════════════════ */
function pedirAcceso()        { Licencia.pedirAcceso(); }
function activar()            { Licencia.activar(); }
function accionInstalar()     { InstallPWA.accion(); }
function cerrarModalIos()     { InstallPWA.cerrarIos(); }
function confirmarOnboarding(){ Onboarding.confirmar(); }
function abrirDrawer()        { Drawer.open(); }
function cerrarDrawer()       { Drawer.close(); }
function abrirConfigTasas()   { ModalConfig.abrirTasas(); }
function abrirSelectorModo()  { ModalConfig.abrirModo(); }
function cerrarModalConfig()  { ModalConfig.cerrar(); }
function toggleTema()         { Tema.toggle(); }
function calc()               { Calculadora.calc(); }
function nuevaVenta()         { Calculadora.nuevaVenta(); }
function agregarMetodo()      { Metodos.agregar(); }
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}