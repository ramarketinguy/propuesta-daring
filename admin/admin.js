const state = {
  session: null,
  ventas: { data: null, page: 1, limit: 20, filters: { q: '', status: '', period: 'all' } },
  emails: { data: null, page: 1, limit: 20, filters: { status: '', provider: '', period: 'all' } },
  settings: null,
  resumen: { period: 'all' },
  stockColors: {},
  theme: 'dark'
};

const SECTIONS = {
  resumen: { title: 'Resumen', subtitle: 'Vista general del estado de la página.', loader: 'resumen' },
  ventas: { title: 'Ventas', subtitle: 'Revisá los checkouts iniciados, las ventas concluidas y las rechazadas.', loader: 'ventas' },
  stock: { title: 'Stock', subtitle: 'Control de unidades disponibles, reservadas y vendidas, por color.', loader: 'stock' },
  contenido: { title: 'Contenido', subtitle: 'Textos, imágenes, archivos y preguntas de la landing, todo en un lugar.', loader: 'contenido' },
  configuracion: { title: 'Configuración', subtitle: 'Precio, contacto, remitentes y plantillas de mail.', loader: 'configuracion' },
  emails: { title: 'Emails enviados', subtitle: 'Bitácora de los mails automáticos al comprador y al dueño.', loader: 'emails' },
  auditoria: { title: 'Auditoría', subtitle: 'Registro de todos los cambios hechos desde el panel.', loader: 'auditoria' },
  uso: { title: 'Uso de Cloudflare', subtitle: 'Espacio ocupado y límites del plan.', loader: 'uso' }
};

const escapeHTML = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const number = (value) => value === null || value === undefined ? '—' : new Intl.NumberFormat('es-UY').format(value);
const money = (cents) => cents === null || cents === undefined ? '—' : `$ ${(cents / 100).toLocaleString('es-UY', { minimumFractionDigits: 0 })}`;
const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const date = new Date(iso.replace(' ', 'T') + 'Z');
    return date.toLocaleString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};
const formatDateShort = (iso) => {
  if (!iso) return '—';
  try {
    const date = new Date(iso.replace(' ', 'T') + 'Z');
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return iso; }
};

function toast(message, type = 'success') {
  const container = document.querySelector('#toast-container');
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  container.append(node);
  setTimeout(() => node.remove(), 4500);
}

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }, ...options });
  if (response.status === 401) { window.location.replace('/admin/login/'); throw new Error('auth'); }
  return response;
}

function showPage(section) {
  document.querySelectorAll('[data-page]').forEach((el) => el.classList.toggle('hidden', el.dataset.page !== section));
  document.querySelectorAll('.sidebar-nav a').forEach((a) => a.classList.toggle('active', a.dataset.section === section));
  const meta = SECTIONS[section];
  document.querySelector('#page-title').textContent = meta.title;
  document.querySelector('#page-subtitle').textContent = meta.subtitle;
}

async function loadResumen() {
  const period = state.resumen.period;
  const query = `?period=${period}`;
  const [summaryRes, alertsRes, ordersRes] = await Promise.all([
    fetch(`/api/metrics/summary${query}`, { credentials: 'same-origin' }),
    fetch(`/api/alerts${query}`, { credentials: 'same-origin' }),
    api(`/api/orders?limit=1&period=${period}`)
  ]);
  if (summaryRes.status === 401 || alertsRes.status === 401) { window.location.replace('/admin/login/'); throw new Error('auth'); }
  if (!summaryRes.ok || !alertsRes.ok || !ordersRes.ok) throw new Error('resumen');
  const summary = await summaryRes.json();
  const alerts = await alertsRes.json();
  const ventas = await ordersRes.json();
  const visitantes = Number(summary.unique_visitors ?? 0);
  const concluidas = Number(ventas.counts.completed ?? 0);
  document.querySelector('#kpi-visits').textContent = number(visitantes);
  document.querySelector('#kpi-visits-trend').textContent = `${number(summary.page_views)} páginas vistas en total`;
  document.querySelector('#kpi-buy-clicks').textContent = number(summary.buy_clicks);
  document.querySelector('#kpi-checkout-opens').textContent = number(summary.checkout_opens);
  document.querySelector('#kpi-checkout-submits').textContent = number(summary.checkout_submits);
  document.querySelector('#kpi-resumen-completed').textContent = number(concluidas);
  document.querySelector('#kpi-resumen-conversion').textContent = visitantes > 0 ? `Convierte el ${Math.round((concluidas / visitantes) * 100)}% de las visitas` : 'Pagos aprobados en Mercado Pago';
  document.querySelector('#kpi-resumen-revenue').textContent = money(ventas.net_cents);
  document.querySelector('#kpi-resumen-fee').textContent = 'Comisión Mercado Pago: ' + money(ventas.fees_cents);
  document.querySelector('#kpi-resumen-initiated').textContent = number(ventas.counts.initiated);
  document.querySelector('#kpi-resumen-rejected').textContent = number(ventas.counts.rejected);
  renderAlerts(alerts.alerts || []);
}

function renderAlerts(alerts) {
  const list = document.querySelector('#alerts-list');
  list.replaceChildren();
  if (!alerts.length) {
    const empty = document.createElement('p');
    empty.className = 'alert-empty';
    empty.textContent = 'Sin alertas por ahora. Con más actividad vas a ver recomendaciones acá.';
    list.append(empty);
    return;
  }
  alerts.forEach((alert) => {
    const card = document.createElement('article');
    card.className = `alert-card ${alert.severity ?? 'review'}`;
    card.innerHTML = `<strong>${escapeHTML(alert.title)}</strong><p>${escapeHTML(alert.explanation)}</p><small>${escapeHTML(alert.action)}</small>`;
    list.append(card);
  });
}

async function loadVentas() {
  const { data, page, limit, filters } = state.ventas;
  const tbody = document.querySelector('#ventas-table tbody');
  const hint = document.querySelector('#ventas-hint');
  const errorBanner = document.querySelector('#ventas-error');
  errorBanner.classList.add('hidden');
  tbody.replaceChildren();
  hint.textContent = 'Cargando...';
  const params = new URLSearchParams({ page: String(page), limit: String(limit), period: filters.period });
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  const response = await api(`/api/orders?${params.toString()}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'ventas');
  state.ventas.data = result;
  document.querySelector('#kpi-initiated').textContent = number(result.counts.initiated);
  document.querySelector('#kpi-completed').textContent = number(result.counts.completed);
  document.querySelector('#kpi-rejected').textContent = number(result.counts.rejected);
  document.querySelector('#kpi-revenue').textContent = money(result.net_cents);
  document.querySelector('#kpi-revenue-fee').textContent = 'Comisión Mercado Pago: ' + money(result.fees_cents);
  hint.textContent = `${number(result.total)} resultados en total`;
  if (!result.orders.length) {
    const empty = document.createElement('tr');
    empty.innerHTML = '<td colspan="7" class="empty-state">Todavía no hay ventas con esos filtros.</td>';
    tbody.append(empty);
  } else {
    result.orders.forEach((order) => {
      const row = document.createElement('tr');
      row.dataset.orderId = order.id;
      const opcionesEnvio = [
        ['', 'Sin estado'],
        ['preparing', 'Preparando'],
        ['shipped', 'Despachado'],
        ['delivered', 'Entregado'],
        ['returned', 'Devuelto']
      ];
      row.innerHTML = `
        <td>${escapeHTML(formatDateShort(order.created_at))}</td>
        <td><strong>${escapeHTML(order.customer_name)}</strong><div class="text-muted">${escapeHTML(order.customer_email)}</div></td>
        <td>${escapeHTML(order.color)}</td>
        <td>${money(order.amount_cents)}</td>
        <td><span class="status-pill s-${escapeHTML(order.status)}">${statusLabel(order.status)}</span></td>
        <td><select class="input envio-select" data-order-id="${escapeHTML(order.id)}" aria-label="Estado de envío de ${escapeHTML(order.customer_name)}">${opcionesEnvio.map(([valor, texto]) => `<option value="${valor}" ${(order.shipping_status ?? '') === valor ? 'selected' : ''}>${texto}</option>`).join('')}</select></td>
        <td class="row-actions"><button class="button-secondary" data-action="detalle">Ver detalle</button></td>`;
      tbody.append(row);
    });
    tbody.querySelectorAll('button[data-action="detalle"]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = button.closest('tr').dataset.orderId;
      openOrderDetail(id);
    }));
    tbody.querySelectorAll('select.envio-select').forEach((select) => {
      select.dataset.current = select.value;
      select.addEventListener('change', async () => {
      const id = select.dataset.orderId;
      const valorAnterior = select.dataset.current ?? '';
      select.disabled = true;
      const response = await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ shipping_status: select.value || null }) });
      const result = await response.json().catch(() => ({}));
      select.disabled = false;
      if (!response.ok) { select.value = valorAnterior; toast(result.error ?? 'No se pudo cambiar el estado de envío.', 'error'); return; }
      toast('Estado de envío actualizado', 'success');
      await loadVentas();
      });
    });
  }
  renderPagination('ventas-pagination', result.total, page, limit, (p) => { state.ventas.page = p; loadVentas(); });
}

function statusLabel(status) {
  return { checkout_started: 'Iniciado', pending: 'Pendiente', approved: 'Concluida', rejected: 'Rechazada', cancelled: 'Cancelada', refunded: 'Reembolsada' }[status] ?? status;
}
function emailStatusLabel(status) {
  return { sent: 'Enviado', failed: 'Con error', queued: 'En cola' }[status] ?? status;
}
function shippingLabel(status) {
  return { preparing: 'Preparando', shipped: 'Despachado', delivered: 'Entregado', returned: 'Devuelto' }[status] ?? 'Sin estado';
}
function normalizarWa(phone) {
  const digitos = String(phone ?? '').replace(/\D/g, '');
  if (!digitos) return '';
  if (digitos.startsWith('598') && digitos.length >= 11) return digitos;
  if (digitos.length === 9 && digitos.startsWith('0')) return '598' + digitos.slice(1);
  if (digitos.length === 8) return '598' + digitos;
  return digitos.length >= 8 ? digitos : '';
}

function renderPagination(elementId, total, page, limit, onChange) {
  const container = document.querySelector('#' + elementId);
  container.replaceChildren();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const info = document.createElement('span');
  info.textContent = `Página ${page} de ${totalPages}`;
  const prev = document.createElement('button');
  prev.textContent = 'Anterior';
  prev.disabled = page <= 1;
  prev.addEventListener('click', () => onChange(page - 1));
  const next = document.createElement('button');
  next.textContent = 'Siguiente';
  next.disabled = page >= totalPages;
  next.addEventListener('click', () => onChange(page + 1));
  container.append(prev, info, next);
}

async function openOrderDetail(id) {
  const container = document.querySelector('#venta-detail');
  container.classList.remove('hidden');
  container.innerHTML = '<p class="empty-state">Cargando...</p>';
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const response = await api(`/api/orders/${id}`);
  const data = await response.json();
  if (!response.ok) { container.innerHTML = `<p class="empty-state">${escapeHTML(data.error || 'No se pudo cargar la venta.')}</p>`; return; }
  renderOrderDetail(data.order, data.timeline, data.emails);
}

function renderOrderDetail(order, timeline, emails) {
  const container = document.querySelector('#venta-detail');
  const waNumero = normalizarWa(order.customer_phone);
  const waLink = waNumero ? `https://wa.me/${waNumero}?text=${encodeURIComponent(`Hola ${order.customer_name ?? ''}, te escribo de Daring por tu compra ${order.order_code ?? ''}.`)}` : '';
  container.innerHTML = `
    <header class="venta-detail-header">
      <h2>Compra <code>${escapeHTML(order.order_code ?? order.id)}</code></h2>
      <div class="venta-header-actions">
        ${waLink ? `<a class="button-secondary" href="${waLink}" target="_blank" rel="noopener">Escribir por WhatsApp</a>` : ''}
        ${order.payment_id ? '<button class="button-secondary" type="button" data-action="verificar-mp">Verificar pago en Mercado Pago</button>' : ''}
        ${order.status === 'approved' ? '<button class="button-secondary" type="button" data-action="reembolsar">Devolver pago</button>' : ''}
        <button class="button-secondary" type="button" data-action="cerrar-detalle">Cerrar</button>
      </div>
    </header>
    <div class="venta-detail-body">
      <section>
        <h3>Datos del comprador</h3>
        <dl>
          <dt>Nombre</dt><dd>${escapeHTML(order.customer_name)}</dd>
          <dt>Email</dt><dd>${escapeHTML(order.customer_email)}</dd>
          <dt>Teléfono</dt><dd>${escapeHTML(order.customer_phone ?? '—')}</dd>
          <dt>Departamento</dt><dd>${escapeHTML(order.shipping_department ?? '—')}</dd>
          <dt>Localidad</dt><dd>${escapeHTML(order.shipping_city ?? '—')}</dd>
          <dt>Dirección</dt><dd>${escapeHTML(order.shipping_address ?? '—')}</dd>
          <dt>Color</dt><dd>${escapeHTML(order.color)}</dd>
          <dt>Cantidad</dt><dd>${escapeHTML(order.quantity)}</dd>
          <dt>Total</dt><dd>${money(order.amount_cents)}</dd>
          <dt>Comisión Mercado Pago</dt><dd>${money(order.mp_fee_cents ?? 0)}</dd>
          <dt>Neto recibido</dt><dd>${money((order.amount_cents ?? 0) - (order.mp_fee_cents ?? 0))}</dd>
          <dt>Estado de pago</dt><dd><span class="status-pill s-${escapeHTML(order.status)}">${statusLabel(order.status)}</span></dd>
          <dt>Pago Mercado Pago</dt><dd>${escapeHTML(order.payment_id ?? '—')}</dd>
        </dl>
      </section>
      <section>
        <h3>Envío y seguimiento</h3>
        <form data-action="update-order" class="venta-update">
          <label>Estado de envío
            <select name="shipping_status">
              <option value="">Sin estado</option>
              <option value="preparing" ${order.shipping_status === 'preparing' ? 'selected' : ''}>Preparando</option>
              <option value="shipped" ${order.shipping_status === 'shipped' ? 'selected' : ''}>Despachado</option>
              <option value="delivered" ${order.shipping_status === 'delivered' ? 'selected' : ''}>Entregado</option>
              <option value="returned" ${order.shipping_status === 'returned' ? 'selected' : ''}>Devuelto</option>
            </select>
          </label>
          <label>Número de seguimiento
            <input type="text" name="tracking_number" maxlength="80" value="${escapeHTML(order.tracking_number ?? '')}" placeholder="Opcional">
          </label>
          <label style="flex:1 1 100%">Notas internas
            <textarea name="admin_notes" maxlength="1000" rows="2" placeholder="Anotaciones privadas sobre esta venta">${escapeHTML(order.admin_notes ?? '')}</textarea>
          </label>
          <button class="button-primary" type="submit">Guardar cambios</button>
          <span data-feedback class="form-status"></span>
        </form>
        <h3 style="margin-top:1.25rem">Timeline</h3>
        <div class="timeline">
          ${timeline.length ? timeline.map((event) => `
            <div class="timeline-item">
              <strong>${escapeHTML(statusLabel(event.event_type.replace('payment_', '').replace('checkout_started', 'Iniciado')))}</strong>
              <time>${escapeHTML(formatDate(event.created_at))}</time>
              ${event.payment_id ? `<div class="text-muted">Pago ${escapeHTML(event.payment_id)}</div>` : ''}
            </div>`).join('') : '<div class="text-muted">Sin eventos todavía.</div>'}
        </div>
        <h3 style="margin-top:1.25rem">Emails enviados</h3>
        ${emails.length ? emails.map((email) => `
          <div class="timeline-item">
            <strong>${escapeHTML(email.provider === 'resend-buyer' ? 'Al comprador' : 'Al dueño')}</strong>
            <span class="status-pill s-${escapeHTML(email.status)}">${escapeHTML(emailStatusLabel(email.status))}</span>
            <time>${escapeHTML(formatDate(email.created_at))}</time>
            ${email.error_message ? `<div class="text-muted">${escapeHTML(email.error_message)}</div>` : ''}
          </div>`).join('') : '<div class="text-muted">Todavía no se enviaron mails automáticos.</div>'}
      </section>
    </div>`;
  container.querySelector('[data-action="cerrar-detalle"]').addEventListener('click', () => {
    container.classList.add('hidden');
    container.innerHTML = '';
  });
  const verificarBtn = container.querySelector('[data-action="verificar-mp"]');
  if (verificarBtn) verificarBtn.addEventListener('click', async () => {
    verificarBtn.disabled = true;
    verificarBtn.textContent = 'Consultando Mercado Pago...';
    const response = await api(`/api/orders/${order.id}/refresh`, { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    verificarBtn.disabled = false;
    verificarBtn.textContent = 'Verificar pago en Mercado Pago';
    if (!response.ok) { toast(result.error ?? 'No se pudo consultar Mercado Pago.', 'error'); return; }
    if (result.changed) { toast(`Pago actualizado: ${statusLabel(result.current)}`, 'success'); await loadVentas(); await openOrderDetail(order.id); }
    else { toast(`Mercado Pago confirma: ${statusLabel(result.current)} (sin cambios)`, 'success'); }
  });
  const reembolsarBtn = container.querySelector('[data-action="reembolsar"]');
  if (reembolsarBtn) reembolsarBtn.addEventListener('click', async () => {
    if (!window.confirm(`¿Devolver ${money(order.amount_cents)} a ${order.customer_name} por Mercado Pago? La venta pasará a "Reembolsada" y la unidad volverá al stock.`)) return;
    reembolsarBtn.disabled = true;
    reembolsarBtn.textContent = 'Procesando devolución...';
    const response = await api(`/api/orders/${order.id}/refund`, { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    reembolsarBtn.disabled = false;
    reembolsarBtn.textContent = 'Devolver pago';
    if (!response.ok) { toast(result.error ?? 'No se pudo procesar la devolución.', 'error'); return; }
    toast('Pago devuelto por Mercado Pago. La unidad volvió al stock.', 'success');
    await loadVentas();
    await openOrderDetail(order.id);
  });
  const form = container.querySelector('form[data-action="update-order"]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = form.querySelector('[data-feedback]');
    feedback.textContent = 'Guardando...';
    feedback.classList.remove('success', 'error');
    const body = {
      shipping_status: form.shipping_status.value || null,
      tracking_number: form.tracking_number.value.trim() || null,
      admin_notes: form.admin_notes.value.trim() || null
    };
    const response = await api(`/api/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { feedback.classList.add('error'); feedback.textContent = result.error ?? 'No se pudo guardar.'; return; }
    feedback.classList.add('success');
    feedback.textContent = 'Cambios guardados.';
    toast('Venta actualizada', 'success');
    await loadVentas();
  });
}

async function exportVentasCSV() {
  const button = document.querySelector('#ventas-export');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Armando archivo...';
  try {
    const { filters } = state.ventas;
    const base = new URLSearchParams({ page: '1', limit: '100', period: filters.period });
    if (filters.q) base.set('q', filters.q);
    if (filters.status) base.set('status', filters.status);
    const todas = [];
    let page = 1;
    for (;;) {
      base.set('page', String(page));
      const response = await api(`/api/orders?${base.toString()}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo exportar.');
      todas.push(...(result.orders ?? []));
      if (!result.orders?.length || todas.length >= (result.total ?? 0)) break;
      page += 1;
    }
    if (!todas.length) { toast('No hay datos para exportar.', 'error'); return; }
    const pesos = (cents) => Math.round((cents ?? 0) / 100);
    const headers = ['Fecha', 'Código', 'Cliente', 'Email', 'Teléfono', 'Departamento', 'Localidad', 'Dirección', 'Color', 'Cantidad', 'Monto ($)', 'Comisión MP ($)', 'Neto ($)', 'Estado pago', 'Estado envío', 'Seguimiento'];
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(';')];
    todas.forEach((order) => {
      lines.push([
        formatDate(order.created_at),
        order.order_code ?? '',
        order.customer_name,
        order.customer_email,
        order.customer_phone ?? '',
        order.shipping_department ?? '',
        order.shipping_city ?? '',
        order.shipping_address ?? '',
        order.color,
        order.quantity ?? 1,
        pesos(order.amount_cents),
        pesos(order.mp_fee_cents),
        pesos(order.amount_cents) - pesos(order.mp_fee_cents),
        statusLabel(order.status),
        shippingLabel(order.shipping_status),
        order.tracking_number ?? ''
      ].map(escape).join(';'));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(`Archivo armado con ${todas.length} ventas.`, 'success');
  } catch (error) {
    toast(error.message ?? 'No se pudo exportar.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function loadEmails() {
  const { page, limit, filters } = state.emails;
  const tbody = document.querySelector('#emails-table tbody');
  tbody.replaceChildren();
  const params = new URLSearchParams({ page: String(page), limit: String(limit), period: filters.period });
  if (filters.status) params.set('status', filters.status);
  if (filters.provider) params.set('provider', filters.provider);
  const response = await api(`/api/emails?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'emails');
  state.emails.data = data;
  document.querySelector('#email-buyer-total').textContent = number(data.counts.buyer_total);
  document.querySelector('#email-buyer-sent').textContent = number(data.counts.buyer_sent);
  document.querySelector('#email-buyer-failed').textContent = number(data.counts.buyer_failed);
  document.querySelector('#email-owner-total').textContent = number(data.counts.owner_total);
  document.querySelector('#email-owner-sent').textContent = number(data.counts.owner_sent);
  document.querySelector('#email-owner-failed').textContent = number(data.counts.owner_failed);
  if (!data.emails.length) {
    const empty = document.createElement('tr');
    empty.innerHTML = '<td colspan="5" class="empty-state">Sin envíos todavía.</td>';
    tbody.append(empty);
  } else {
    data.emails.forEach((email) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHTML(formatDate(email.created_at))}</td>
        <td><code class="text-muted">${escapeHTML(email.order_code ?? email.order_id.slice(0, 8))}</code></td>
        <td>${escapeHTML(email.provider === 'resend-buyer' ? 'Al comprador' : 'Al dueño')}</td>
        <td><span class="status-pill s-${escapeHTML(email.status)}">${escapeHTML(emailStatusLabel(email.status))}</span></td>
        <td class="text-muted">${escapeHTML(email.error_message ?? 'OK')}</td>`;
      tbody.append(row);
    });
  }
  renderPagination('emails-pagination', data.total, page, limit, (p) => { state.emails.page = p; loadEmails(); });
}

async function loadConfiguracion() {
  if (state.settings) {
    populateSettings(state.settings);
    return;
  }
  const response = await api('/api/settings');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'settings');
  state.settings = data.flat;
  populateSettings(state.settings);
}

function populateSettings(flat) {
  const form = document.querySelector('#settings-form');
  form.querySelectorAll('[name]').forEach((input) => {
    let value = flat[input.name] ?? '';
    if (input.name === 'price') {
      const cents = Number(flat.price_cents ?? 0);
      value = cents ? Math.round(cents / 100) : '';
    }
    if (input.type === 'checkbox') input.checked = value === 'true' || value === true;
    else input.value = value;
  });
}

async function saveSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('#settings-status');
  status.classList.remove('success', 'error');
  status.textContent = 'Guardando...';
  const values = {};
  form.querySelectorAll('[name]').forEach((input) => {
    if (input.type === 'checkbox') values[input.name] = input.checked ? 'true' : 'false';
    else if (input.name === 'price') values.price_cents = String(Math.max(0, Math.round(Number(input.value) * 100)));
    else values[input.name] = input.value;
  });
  const response = await api('/api/settings', { method: 'PUT', body: JSON.stringify({ values }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { status.classList.add('error'); status.textContent = data.error ?? 'No se pudo guardar.'; return; }
  status.classList.add('success');
  status.textContent = 'Cambios guardados.';
  toast('Configuración guardada', 'success');
  state.settings = null;
  await loadConfiguracion();
}

async function loadContenido() {
  await loadContenidoTextos();
  await loadCarouselManager('pizza', 'manager-pizza', 'hint-pizza', 'el carrusel de platos');
  await loadCarouselManager('testimonials', 'manager-testimonials', 'hint-testimonials', 'el carrusel de testimonios');
  await loadHistoria();
  await loadFaq();
}

async function loadContenidoTextos() {
  const container = document.querySelector('#contenido-fields');
  const status = document.querySelector('#contenido-status');
  status.textContent = '';
  status.classList.remove('success', 'error');
  const response = await api('/api/content');
  if (!response.ok) { container.innerHTML = '<p class="empty-state">No se pudo cargar el contenido.</p>'; return; }
  const data = await response.json();
  const sections = data.sections ?? {};
  container.replaceChildren();
  const SECTION_LABELS = { hero: 'Hero (parte superior de la página)', platos: 'Sección Versatilidad', diseno: 'Sección Diseño e Ingeniería', oferta: 'Sección Oferta', cierre: 'Cierre de la página' };
  for (const [section, fields] of Object.entries(sections)) {
    const group = document.createElement('fieldset');
    group.className = 'settings-group';
    group.style.gridTemplateColumns = '1fr';
    const legend = document.createElement('legend');
    legend.textContent = SECTION_LABELS[section] ?? section;
    group.append(legend);
    fields.forEach((field) => {
      const wrap = document.createElement('label');
      wrap.textContent = field.label;
      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 3;
        input.value = field.value ?? '';
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.value = field.value ?? '';
      }
      input.dataset.key = field.key;
      input.maxLength = field.type === 'textarea' ? 2000 : 500;
      wrap.append(input);
      group.append(wrap);
    });
    container.append(group);
  }
}

async function saveContenido() {
  const status = document.querySelector('#contenido-status');
  const inputs = document.querySelectorAll('#contenido-fields [data-key]');
  const values = {};
  inputs.forEach((input) => { values[input.dataset.key] = input.value; });
  status.textContent = 'Guardando...';
  status.classList.remove('success', 'error');
  const response = await api('/api/content', { method: 'PUT', body: JSON.stringify({ values }) });
  if (!response.ok) { status.classList.add('error'); status.textContent = 'No se pudo guardar.'; return; }
  status.classList.add('success');
  status.textContent = 'Cambios guardados. Ya están publicados en la página.';
  toast('Contenido actualizado', 'success');
}

async function loadCarouselManager(placement, containerId, hintId, nombre) {
  const container = document.querySelector('#' + containerId);
  const hint = document.querySelector('#' + hintId);
  const response = await api('/api/media');
  const data = await response.json();
  if (!response.ok) { container.innerHTML = '<p class="empty-state">No se pudieron cargar los archivos.</p>'; return; }
  const items = (data.media ?? []).filter((m) => m.placement === placement && m.published === 1).sort((a, b) => a.sort_order - b.sort_order);
  if (!items.length) {
    container.innerHTML = `<p class="empty-state">Todavía no agregaste archivos. La página muestra el contenido original de esta sección.</p>`;
    return;
  }
  hint.textContent = `${items.length} en la página · ordená con las flechas`;
  container.replaceChildren();
  items.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'carousel-item-card';
    card.dataset.id = item.id;
    const preview = item.media_type === 'video'
      ? `<video src="${escapeHTML(item.url)}" muted preload="metadata"></video>`
      : `<img src="${escapeHTML(item.url)}" alt="${escapeHTML(item.alt_text || item.title || item.file_name)}">`;
    card.innerHTML = `
      ${preview}
      <div class="carousel-item-actions">
        <button class="button-secondary" type="button" data-move="-1" ${index === 0 ? 'disabled' : ''} aria-label="Mover antes">←</button>
        <button class="button-secondary" type="button" data-move="1" ${index === items.length - 1 ? 'disabled' : ''} aria-label="Mover después">→</button>
        <button class="button-secondary" type="button" data-action="eliminar">Eliminar</button>
      </div>`;
    container.append(card);
  });
  container.querySelectorAll('.carousel-item-card').forEach((card) => {
    const index = items.findIndex((m) => m.id === card.dataset.id);
    card.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', async () => {
      const target = items[index + Number(button.dataset.move)];
      if (!target) return;
      await api('/api/media/reorder', { method: 'POST', body: JSON.stringify({ id: card.dataset.id, sort_order: target.sort_order }) });
      await api('/api/media/reorder', { method: 'POST', body: JSON.stringify({ id: target.id, sort_order: items[index].sort_order }) });
      await loadCarouselManager(placement, containerId, hintId, nombre);
    }));
    card.querySelector('[data-action="eliminar"]').addEventListener('click', async () => {
      if (!window.confirm('¿Eliminar este archivo del carrusel? También desaparece de la biblioteca.')) return;
      const response = await api(`/api/media?id=${encodeURIComponent(card.dataset.id)}`, { method: 'DELETE' });
      if (response.ok) await loadCarouselManager(placement, containerId, hintId, nombre);
    });
  });
}

async function compressImage(file) {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const MAX = 1920;
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 2 * 1024 * 1024) { if (bitmap.close) bitmap.close(); return file; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (bitmap.close) bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return file;
    const name = (file.name || 'imagen').replace(/\.[^.]+$/, '');
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } catch { return file; }
}

const MAX_VIDEO_BYTES = 12 * 1024 * 1024;
function validarVideo(file) {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`Ese video pesa ${(file.size / 1048576).toFixed(1)} MB y el máximo permitido es 12 MB. Probá con una versión más corta o comprimida.`);
  }
}

async function subirArchivo(placement, file) {
  const formData = new FormData();
  formData.set('placement', placement);
  formData.set('file', await compressImage(file));
  formData.set('title', file.name.replace(/\.[^.]+$/, ''));
  const response = await api('/api/media', { method: 'POST', body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'No se pudo subir el archivo.');
  await api('/api/media/publish', { method: 'POST', body: JSON.stringify({ id: data.id, published: true }) });
  return data.id;
}

async function wireCarouselUpload(placement, buttonSelector, inputSelector, containerId, hintId, nombre) {
  const button = document.querySelector(buttonSelector);
  const input = document.querySelector(inputSelector);
  if (!button || !input) return;
  button.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    button.disabled = true;
    button.textContent = 'Subiendo…';
    try {
      if (file.type.startsWith('video/')) validarVideo(file);
      await subirArchivo(placement, file);
      toast('Archivo agregado y publicado', 'success');
      await loadCarouselManager(placement, containerId, hintId, nombre);
    } catch (error) {
      toast(error.message ?? 'No se pudo subir el archivo.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = placement === 'pizza' ? '＋ Agregar imagen' : '＋ Agregar video';
      input.value = '';
    }
  });
}

async function loadHistoria() {
  const container = document.querySelector('#manager-historia');
  const input = document.querySelector('#file-historia');
  const [imagesRes, mediaRes] = await Promise.all([api('/api/images'), api('/api/media')]);
  const imagesData = await imagesRes.json();
  const mediaData = await mediaRes.json();
  const slot = (imagesData.images ?? []).find((s) => s.slot === 'historia.foto');
  if (!slot) { container.innerHTML = '<p class="empty-state">Posición no disponible.</p>'; return; }
  const defaultUrl = slot.default_path.startsWith('/') ? slot.default_path : '/' + slot.default_path;
  const currentUrl = slot.media_id && slot.media_published === 1 ? `/api/media/file?id=${slot.media_id}` : defaultUrl;
  const opciones = (mediaData.media ?? []).filter((m) => m.placement === 'history' && m.published === 1);
  container.innerHTML = `
    <div class="image-slot-card">
      <div class="image-slot-preview"><img src="${escapeHTML(currentUrl)}" alt="Foto del dueño"></div>
      <div class="image-slot-copy">
        <strong>Foto de Irineo en "Nuestra historia"</strong>
        <span class="text-muted">${slot.media_id ? 'Usando archivo de la biblioteca' : 'Usando la foto original'}</span>
        <div class="form-actions">
          <button class="button-secondary" type="button" data-action="cambiar">Cambiar imagen</button>
          ${slot.media_id ? '<button class="button-secondary" type="button" data-action="original">Volver a la original</button>' : ''}
          <span data-feedback class="form-status"></span>
        </div>
      </div>
    </div>`;
  container.querySelector('[data-action="cambiar"]').addEventListener('click', () => input.click());
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const feedback = container.querySelector('[data-feedback]');
    feedback.textContent = 'Subiendo...';
    try {
      const id = await subirArchivo('history', file);
      await api('/api/images', { method: 'PUT', body: JSON.stringify({ slot: 'historia.foto', media_id: id }) });
      feedback.textContent = 'Actualizada.';
      toast('Foto del dueño actualizada', 'success');
      await loadHistoria();
    } catch (error) {
      feedback.textContent = error.message ?? 'No se pudo subir.';
    } finally {
      input.value = '';
    }
  };
  const originalButton = container.querySelector('[data-action="original"]');
  if (originalButton) originalButton.addEventListener('click', async () => {
    await api('/api/images', { method: 'PUT', body: JSON.stringify({ slot: 'historia.foto', media_id: null }) });
    toast('Volviste a la foto original', 'success');
    await loadHistoria();
  });
}

async function loadFaq() {
  const list = document.querySelector('#faq-list');
  list.innerHTML = '<p class="empty-state">Cargando preguntas…</p>';
  const response = await api('/api/faq');
  if (!response.ok) { list.innerHTML = '<p class="empty-state">No se pudieron cargar las preguntas.</p>'; return; }
  const data = await response.json();
  const items = data.faq ?? [];
  if (!items.length) { list.innerHTML = '<p class="empty-state">Todavía no hay preguntas frecuentes.</p>'; return; }
  list.replaceChildren();
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'faq-admin-card';
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="faq-admin-body">
        <label>Pregunta<input data-field="question" maxlength="240" value="${escapeHTML(item.question)}"></label>
        <label>Respuesta<textarea data-field="answer" rows="3" maxlength="2000">${escapeHTML(item.answer)}</textarea></label>
        <label>Orden<input data-field="sort_order" type="number" min="0" value="${item.sort_order}"></label>
        <label class="settings-toggle"><input type="checkbox" data-field="published" ${item.published === 1 ? 'checked' : ''}>Publicada</label>
      </div>
      <div class="form-actions"><button class="button-secondary" type="button" data-action="guardar">Guardar</button><button class="button-secondary" type="button" data-action="eliminar">Eliminar</button><span data-feedback class="form-status"></span></div>`;
    list.append(card);
  });
  list.querySelectorAll('.faq-admin-card').forEach((card) => listItem => null);
  list.querySelectorAll('.faq-admin-card').forEach((card) => wireFaqCard(card));
}

function wireFaqCard(card) {
  const id = card.dataset.id;
  const feedback = card.querySelector('[data-feedback]');
  card.querySelector('[data-action="guardar"]').addEventListener('click', async () => {
    const body = {
      question: card.querySelector('[data-field="question"]').value,
      answer: card.querySelector('[data-field="answer"]').value,
      sort_order: Number(card.querySelector('[data-field="sort_order"]').value),
      published: card.querySelector('[data-field="published"]').checked
    };
    feedback.textContent = 'Guardando...';
    feedback.classList.remove('success', 'error');
    const response = await api(`/api/faq/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    if (!response.ok) { feedback.classList.add('error'); feedback.textContent = 'No se pudo guardar.'; return; }
    feedback.classList.add('success');
    feedback.textContent = 'Guardado.';
    toast('Pregunta actualizada', 'success');
  });
  card.querySelector('[data-action="eliminar"]').addEventListener('click', async () => {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    const response = await api(`/api/faq/${id}`, { method: 'DELETE' });
    if (response.ok) { toast('Pregunta eliminada', 'success'); await loadFaq(); }
  });
}

async function createFaq(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = {
    question: form.question.value.trim(),
    answer: form.answer.value.trim(),
    sort_order: 0
  };
  if (!body.question || !body.answer) return;
  const response = await api('/api/faq', { method: 'POST', body: JSON.stringify(body) });
  if (!response.ok) { toast('No se pudo crear.', 'error'); return; }
  form.reset();
  toast('Pregunta agregada', 'success');
  await loadFaq();
}

async function loadUso() {
  const response = await api('/api/cloudflare/usage');
  const data = await response.json();
  document.querySelector('#usage-plan').textContent = data.plan_label ?? data.plan ?? 'Cloudflare Free';
  document.querySelector('#usage-r2').textContent = number(data.r2?.object_count);
  document.querySelector('#usage-r2-copy').textContent = `${((data.r2?.size_bytes ?? 0) / 1024 / 1024).toFixed(2)} MB usados · ${data.r2?.limit_label ?? ''} (${data.r2?.used_percent ?? 0}%)`;
  document.querySelector('#usage-d1').textContent = number(data.d1?.analytics_events ?? 0);
  renderUsageLimits(data);
}

function renderUsageLimits(data) {
  const container = document.querySelector('#usage-limits');
  container.replaceChildren();
  const r2Percent = Number(data.r2?.used_percent ?? 0);
  const resumen = document.createElement('p');
  resumen.className = 'empty-state';
  resumen.style.textAlign = 'left';
  resumen.style.margin = '0 0 1rem';
  resumen.textContent = r2Percent >= 80
    ? 'Atención: el almacenamiento está llegando al límite del plan gratuito. Avisale a Ramiro.'
    : 'Todo está dentro de lo normal: no hay riesgo de costos extra ni de cortes por límites.';
  container.append(resumen);
  const groups = [
    { title: 'Fotos y videos guardados', items: [
      { label: 'Archivos guardados', current: `${number(data.r2?.object_count)} archivos`, limit: 'ilimitado (se paga por uso)' },
      { label: 'Espacio ocupado', current: `${((data.r2?.size_bytes ?? 0) / 1024 / 1024).toFixed(2)} MB`, limit: data.r2?.limit_label ?? '10 GB' },
      { label: 'Lecturas de archivos por mes', current: '— (no se mide)', limit: '10.000.000' },
      { label: 'Subidas de archivos por mes', current: '— (no se mide)', limit: '1.000.000' }
    ]},
    { title: 'Base de datos (ventas, mails, visitas)', items: [
      { label: 'Registros guardados (aprox.)', current: `${number(data.d1?.estimate_rows ?? 0)} registros`, limit: 'millones' },
      { label: 'Espacio de la base', current: '— (no se mide)', limit: data.d1?.limit_label ?? '5 GB' },
      { label: 'Consultas por día', current: '— (no se mide)', limit: '5.000.000' },
      { label: 'Guardados por día', current: '— (no se mide)', limit: '100.000' }
    ]},
    { title: 'La página en sí', items: [
      { label: 'Publicaciones por mes', current: '— (no se mide)', limit: '500' },
      { label: 'Dominios conectados', current: '1 conectado', limit: '100' },
      { label: 'Archivos del sitio', current: '— (no se mide)', limit: '20.000' }
    ]},
    { title: 'Funciones automáticas', items: [
      { label: 'Visitas y consultas por día', current: '— (no se mide)', limit: '100.000' },
      { label: 'Tiempo de proceso por visita', current: '— (no se mide)', limit: '10 ms por visita (límite generoso)' }
    ]}
  ];
  groups.forEach((group) => {
    const section = document.createElement('section');
    section.innerHTML = `<h3>${escapeHTML(group.title)}</h3>`;
    const table = document.createElement('div');
    table.className = 'limits-table';
    group.items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'limits-row';
      row.innerHTML = `<span class="limits-label">${escapeHTML(item.label)}</span><span class="limits-current">${escapeHTML(item.current)}</span><span class="limits-limit">Límite: ${escapeHTML(item.limit)}</span>`;
      table.append(row);
    });
    section.append(table);
    container.append(section);
  });
}


async function loadStock() {
  const response = await api('/api/stock');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'stock');
  document.querySelector('#stock-available').textContent = number(data.totals.available);
  document.querySelector('#stock-sold').textContent = number(data.totals.sold);
  const porColor = {};
  data.colors.forEach((c) => { porColor[c.color] = c; });
  state.stockColors = porColor;
  const rojo = porColor.rojo;
  const negro = porColor.negro;
  document.querySelector('#stock-rojo').textContent = number(rojo?.available ?? 0);
  document.querySelector('#stock-rojo-copy').textContent = `${number(rojo?.stock_sold ?? 0)} vendidas · ${number(rojo?.stock_reserved ?? 0)} reservadas`;
  document.querySelector('#stock-negro').textContent = number(negro?.available ?? 0);
  document.querySelector('#stock-negro-copy').textContent = `${number(negro?.stock_sold ?? 0)} vendidas · ${number(negro?.stock_reserved ?? 0)} reservadas`;
  const form = document.querySelector('#stock-form');
  const colorElegido = form.color.value;
  const fila = porColor[colorElegido];
  if (fila && document.activeElement?.name !== 'stock_total') form.stock_total.value = fila.stock_total;
  const tbody = document.querySelector('#stock-movements');
  tbody.replaceChildren();
  if (!data.movements.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Sin movimientos todavía.</td></tr>';
    return;
  }
  data.movements.forEach((m) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(formatDate(m.created_at))}</td>
      <td><strong>${m.quantity > 0 ? '+' : ''}${escapeHTML(m.quantity)}</strong></td>
      <td class="text-muted">${escapeHTML(m.reason)}</td>
      <td class="text-muted">${m.order_id ? `<code>${escapeHTML(m.order_id.slice(0, 8))}</code>` : '—'}</td>`;
    tbody.append(row);
  });
}

async function saveStock(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('#stock-status');
  status.classList.remove('success', 'error');
  status.textContent = 'Guardando...';
  const response = await api('/api/stock', { method: 'PATCH', body: JSON.stringify({ color: form.color.value, stock_total: Number(form.stock_total.value), reason: form.reason.value }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { status.classList.add('error'); status.textContent = data.error ?? 'No se pudo guardar.'; return; }
  status.classList.add('success');
  status.textContent = 'Stock actualizado.';
  toast('Stock actualizado', 'success');
  await loadStock();
}

const LOADERS = {
  resumen: loadResumen,
  ventas: loadVentas,
  stock: loadStock,
  contenido: loadContenido,
  configuracion: loadConfiguracion,
  emails: loadEmails,
  auditoria: loadAuditoria,
  uso: loadUso
};

const stateAudit = { page: 1, limit: 30, action: '' };

const NOMBRES_SETTING = {
  price_cents: 'el precio',
  currency: 'la moneda',
  initial_stock_visible: 'el stock visible',
  whatsapp_phone: 'el número de WhatsApp',
  owner_email: 'el mail del dueño',
  owner_email_enabled: 'los avisos al dueño',
  buyer_from_email: 'el remitente del mail al comprador',
  buyer_from_name: 'el nombre del remitente al comprador',
  owner_from_email: 'el remitente del mail al dueño',
  owner_from_name: 'el nombre del remitente al dueño',
  buyer_email_subject: 'el asunto del mail al comprador',
  buyer_email_html: 'el cuerpo del mail al comprador',
  owner_email_subject: 'el asunto del mail al dueño',
  owner_email_html: 'el cuerpo del mail al dueño',
  telegram_enabled: 'las notificaciones de Telegram',
  telegram_bot_token: 'el bot de Telegram',
  telegram_chat_id: 'el chat de Telegram'
};

const SECCION_TEXTO = {
  hero: 'el inicio de la página',
  platos: 'la sección de platos',
  diseno: 'la sección de diseño e ingeniería',
  oferta: 'la sección de oferta',
  cierre: 'el cierre de la página'
};

function describirAuditoria(entry) {
  let d = {};
  try { d = entry.details ? JSON.parse(entry.details) : {}; } catch { return 'Cambio registrado.'; }
  switch (entry.action) {
    case 'settings.update': {
      const cambios = Array.isArray(d) ? d.map((u) => NOMBRES_SETTING[u.key] ?? u.key) : [];
      return 'Se actualizó la configuración: ' + (cambios.join(', ') || 'datos generales') + '.';
    }
    case 'orders.update': {
      const partes = [];
      if (d.shipping_status) partes.push('estado de envío: ' + ({ preparing: 'preparando', shipped: 'despachado', delivered: 'entregado', returned: 'devuelto' }[d.shipping_status] ?? d.shipping_status));
      if (d.tracking_number) partes.push('número de seguimiento cargado');
      if (d.admin_notes) partes.push('notas internas');
      return 'Se actualizó una venta' + (partes.length ? ' (' + partes.join(', ') + ')' : '') + '.';
    }
    case 'orders.refund': {
      const monto = d.amount_cents != null ? ' de ' + money(d.amount_cents) : '';
      const compra = d.order_code ? ` (compra ${d.order_code})` : '';
      const quien = d.customer_name ? ` a ${d.customer_name}` : '';
      return `Se devolvió el pago${monto}${quien} por Mercado Pago${compra}.`;
    }
    case 'stock.update':
      return 'Se ajustó el stock' + (entry.entity_id ? ' del color ' + entry.entity_id : '') + ': de ' + (d.previous ?? '?') + ' a ' + (d.next ?? '?') + ' unidades' + (d.reason ? ' — ' + d.reason : '') + '.';
    case 'faq.create':
      return 'Se agregó una pregunta frecuente.';
    case 'faq.update':
      return 'Se editó una pregunta frecuente.';
    case 'faq.delete':
      return 'Se eliminó una pregunta frecuente.';
    case 'page_content.update': {
      const claves = Array.isArray(d) ? d.map((u) => u.key) : [];
      const secciones = [...new Set(claves.map((k) => k.split('.')[0]))].map((s) => SECCION_TEXTO[s] ?? s);
      return 'Se editaron los textos de ' + (secciones.join(' y ') || 'la página') + '.';
    }
    case 'page_images.update':
      return entry.entity_id === 'historia.foto' ? 'Se cambió la foto del dueño.' : 'Se cambió una imagen de la página.';
    case 'maintenance.cleanup':
      return 'Limpieza automática: se borraron ' + (d.deleted ?? 0) + ' archivos sin uso de la biblioteca.';
    default:
      return 'Cambio registrado.';
  }
}

async function loadAuditoria() {
  const tbody = document.querySelector('#audit-table tbody');
  tbody.replaceChildren();
  const params = new URLSearchParams({ page: String(stateAudit.page), limit: String(stateAudit.limit) });
  if (stateAudit.action) params.set('action', stateAudit.action);
  const response = await api(`/api/audit?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'auditoria');
  if (!data.entries.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="empty-state">Sin registros todavía.</td></tr>';
  } else {
    data.entries.forEach((entry) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHTML(formatDate(entry.created_at))}</td>
        <td style="white-space:normal">${escapeHTML(describirAuditoria(entry))}</td>`;
      tbody.append(row);
    });
  }
  renderPagination('audit-pagination', data.total, stateAudit.page, stateAudit.limit, (p) => { stateAudit.page = p; loadAuditoria().catch(() => undefined); });
}

function navigate() {
  const hash = window.location.hash.replace('#', '') || 'resumen';
  const section = SECTIONS[hash] ? hash : 'resumen';
  showPage(section);
  const loader = LOADERS[SECTIONS[section].loader];
  if (loader) loader().catch(() => {
    toast(`No se pudo cargar la sección ${SECTIONS[section].title}. Revisá tu conexión y volvé a entrar.`, 'error');
    if (section === 'ventas') {
      document.querySelector('#ventas-hint').textContent = 'No se pudo cargar. Probá recargando la página.';
      const banner = document.querySelector('#ventas-error');
      banner.textContent = 'No se pudieron cargar las ventas. Revisá tu conexión y probá de nuevo.';
      banner.classList.remove('hidden');
    }
  });
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle('theme-light', theme === 'light');
  document.body.classList.toggle('theme-dark', theme === 'dark');
  const label = document.querySelector('#theme-toggle-label');
  if (label) label.textContent = theme === 'light' ? 'Oscuro' : 'Claro';
  try { localStorage.setItem('admin-theme', theme); } catch {}
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('admin-theme'); } catch {}
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved ?? (prefersLight ? 'light' : 'dark'));
}

async function boot() {
  const session = await fetch('/api/auth/session', { credentials: 'same-origin' }).then((r) => r.json()).catch(() => ({ authenticated: false }));
  if (!session.authenticated) { window.location.replace('/admin/login/'); return; }
  state.session = session;
  document.querySelector('#user-email').textContent = session.admin?.email ?? '';

  document.querySelectorAll('.sidebar-nav a').forEach((a) => a.addEventListener('click', (event) => {
    const section = a.dataset.section;
    if (!section) return;
    if (window.location.hash !== `#${section}`) {
      window.location.hash = `#${section}`;
    }
  }));
  document.querySelector('#logout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.replace('/admin/login/');
  });
  document.querySelector('#settings-form').addEventListener('submit', saveSettings);
  document.querySelector('#theme-toggle').addEventListener('click', () => applyTheme(state.theme === 'light' ? 'dark' : 'light'));
  document.querySelector('#contenido-save').addEventListener('click', saveContenido);
  document.querySelector('#faq-form').addEventListener('submit', createFaq);
  document.querySelector('#stock-form').addEventListener('submit', saveStock);
  document.querySelector('#stock-form select[name="color"]').addEventListener('change', (event) => {
    const fila = state.stockColors[event.currentTarget.value];
    const input = document.querySelector('#stock-form input[name="stock_total"]');
    if (fila && document.activeElement !== input) input.value = fila.stock_total;
  });

  const auditAction = document.querySelector('#audit-action');
  auditAction.addEventListener('change', () => {
    stateAudit.action = auditAction.value;
    stateAudit.page = 1;
    loadAuditoria().catch(() => undefined);
  });

  document.querySelectorAll('[data-content-tab-button]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-content-tab-button]').forEach((b) => b.classList.toggle('active', b === button));
    document.querySelectorAll('[data-content-tab]').forEach((group) => group.classList.toggle('hidden', group.dataset.contentTab !== button.dataset.contentTabButton));
  }));

  const ventasSearch = document.querySelector('#ventas-search');
  const ventasStatus = document.querySelector('#ventas-status');
  const ventasPeriod = document.querySelector('#ventas-period');
  const refreshVentas = () => { state.ventas.page = 1; loadVentas().catch(() => undefined); };
  let searchTimer;
  ventasSearch.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(refreshVentas, 250); });
  ventasStatus.addEventListener('change', () => { state.ventas.filters.status = ventasStatus.value; refreshVentas(); });
  ventasPeriod.addEventListener('change', () => { state.ventas.filters.period = ventasPeriod.value; refreshVentas(); });
  document.querySelector('#ventas-export').addEventListener('click', exportVentasCSV);

  const resumenPeriod = document.querySelector('#resumen-period');
  resumenPeriod.addEventListener('change', () => { state.resumen.period = resumenPeriod.value; loadResumen().catch(() => undefined); });

  const emailsStatus = document.querySelector('#emails-status');
  const emailsProvider = document.querySelector('#emails-provider');
  const emailsPeriod = document.querySelector('#emails-period');
  const refreshEmails = () => { state.emails.page = 1; loadEmails().catch(() => undefined); };
  emailsStatus.addEventListener('change', () => { state.emails.filters.status = emailsStatus.value; refreshEmails(); });
  emailsProvider.addEventListener('change', () => { state.emails.filters.provider = emailsProvider.value; refreshEmails(); });
  emailsPeriod.addEventListener('change', () => { state.emails.filters.period = emailsPeriod.value; refreshEmails(); });

  initTheme();
  window.addEventListener('hashchange', navigate);
  navigate();
}

document.addEventListener('DOMContentLoaded', boot);
