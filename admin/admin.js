const statusDot = document.querySelector('#status-dot');
const statusTitle = document.querySelector('#status-title');
const statusCopy = document.querySelector('#status-copy');
const logoutButton = document.querySelector('#logout');
const dashboard = document.querySelector('#dashboard');
const metricsEmpty = document.querySelector('#metrics-empty');
const period = document.querySelector('#period');
const mediaForm = document.querySelector('#media-form');
const mediaStatus = document.querySelector('#media-status');
const mediaList = document.querySelector('#media-list');
const usageR2 = document.querySelector('#usage-r2');
const usageR2Copy = document.querySelector('#usage-r2-copy');
const usageD1 = document.querySelector('#usage-d1');
const usagePlan = document.querySelector('#usage-plan');
const usagePlanCopy = document.querySelector('#usage-plan-copy');

async function getSession() {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  return response.json();
}

async function checkHealth() {
  const response = await fetch('/api/admin/health', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('health');
  return response.json();
}

function number(value) {
  return value === null || value === undefined ? '—' : new Intl.NumberFormat('es-UY').format(value);
}

function renderAlerts(alerts) {
  const list = document.querySelector('#alert-list');
  list.replaceChildren();
  if (!alerts.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No hay alertas para este período.';
    list.append(empty);
    return;
  }
  alerts.forEach((alert) => {
    const card = document.createElement('article');
    card.className = 'alert-card';
    card.innerHTML = `<strong>${alert.title}</strong><p>${alert.explanation}</p><small>Qué hacer: ${alert.action}</small>`;
    list.append(card);
  });
}

async function loadDashboard() {
  const query = `?period=${encodeURIComponent(period.value)}`;
  const [summaryResponse, alertsResponse] = await Promise.all([fetch(`/api/metrics/summary${query}`), fetch(`/api/alerts${query}`)]);
  if (!summaryResponse.ok || !alertsResponse.ok) throw new Error('metrics');
  const summary = await summaryResponse.json();
  const alerts = await alertsResponse.json();
  document.querySelector('#metric-page-views').textContent = number(summary.page_views);
  document.querySelector('#metric-buy-clicks').textContent = number(summary.buy_clicks);
  document.querySelector('#metric-checkout-opens').textContent = number(summary.checkout_opens);
  document.querySelector('#metric-checkout-submits').textContent = number(summary.checkout_submits);
  renderAlerts(alerts.alerts || []);
  dashboard.classList.remove('hidden');
  metricsEmpty.classList.toggle('hidden', summary.page_views > 0 || summary.buy_clicks > 0 || summary.checkout_opens > 0 || summary.checkout_submits > 0);
}

async function loadMedia() {
  const response = await fetch('/api/media', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('media');
  const result = await response.json();
  mediaList.replaceChildren();
  result.media.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'media-card';
    const preview = item.media_type === 'video' ? document.createElement('video') : document.createElement('img');
    preview.src = item.url;
    preview.controls = item.media_type === 'video';
    if (item.media_type === 'image') preview.alt = item.alt_text || item.file_name;
    const copy = document.createElement('div');
    copy.innerHTML = `<strong>${item.title || item.file_name}</strong><span>${item.placement} · ${item.published ? 'Publicado' : 'Sin publicar'}</span><input class="media-order" data-order-id="${item.id}" type="number" min="0" value="${item.sort_order || 0}" aria-label="Orden de ${item.file_name}"><button class="button media-save-order" data-id="${item.id}">Guardar orden</button><button class="button media-publish" data-id="${item.id}" data-published="${item.published ? 'false' : 'true'}">${item.published ? 'Ocultar' : 'Publicar'}</button><button class="button media-delete" data-id="${item.id}">Eliminar</button>`;
    card.append(preview, copy);
    mediaList.append(card);
  });
  if (!result.media.length) mediaList.innerHTML = '<p class="muted">Todavía no hay recursos cargados.</p>';
  mediaList.querySelectorAll('.media-publish').forEach((button) => button.addEventListener('click', async () => {
    const response = await fetch('/api/media/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: button.dataset.id, published: button.dataset.published === 'true' }) });
    if (response.ok) await loadMedia();
  }));
  mediaList.querySelectorAll('.media-save-order').forEach((button) => button.addEventListener('click', async () => {
    const input = mediaList.querySelector(`[data-order-id="${button.dataset.id}"]`);
    const response = await fetch('/api/media/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: button.dataset.id, sort_order: Number(input.value) }) });
    button.textContent = response.ok ? 'Guardado' : 'Error';
  }));
  mediaList.querySelectorAll('.media-delete').forEach((button) => button.addEventListener('click', async () => {
    if (!window.confirm('¿Eliminar este recurso?')) return;
    const response = await fetch(`/api/media?id=${encodeURIComponent(button.dataset.id)}`, { method: 'DELETE', credentials: 'same-origin' });
    if (response.ok) await loadMedia();
  }));
}

async function loadUsage() {
  const response = await fetch('/api/cloudflare/usage', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('usage');
  const result = await response.json();
  usageR2.textContent = number(result.r2.object_count);
  usageR2Copy.textContent = `${(result.r2.size_bytes / 1024 / 1024).toFixed(2)} MB usados`;
  usageD1.textContent = number(result.d1.analytics_events);
  usagePlan.textContent = result.cloudflare_plan_limits.status === 'api_configured' ? 'API lista' : 'No disponible';
  usagePlanCopy.textContent = result.cloudflare_plan_limits.message;
}

async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/webp') return file;
  const image = new Image();
  const url = URL.createObjectURL(file);
  try {
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1600 / image.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', .82));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' }) : file;
  } finally { URL.revokeObjectURL(url); }
}

async function boot() {
  try {
    const session = await getSession();
    if (!session.authenticated) {
      window.location.replace('/admin/login/');
      return;
    }
    await checkHealth();
    statusTitle.textContent = 'Panel conectado';
    statusCopy.textContent = `Sesión activa para ${session.admin.email}.`;
    await loadDashboard();
    await loadMedia();
    await loadUsage();
  } catch {
    statusDot.classList.add('error');
    statusTitle.textContent = 'No se pudo verificar la conexión';
    statusCopy.textContent = 'La landing pública sigue funcionando, pero el panel no pudo consultar la API.';
  }
}

logoutButton.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/admin/login/');
});

period.addEventListener('change', () => loadDashboard().catch(() => undefined));
mediaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  mediaStatus.textContent = 'Subiendo y validando archivo...';
  const formData = new FormData(mediaForm);
  const selectedFile = formData.get('file');
  if (!(selectedFile instanceof File)) { mediaStatus.textContent = 'Elegí un archivo.'; return; }
  if (selectedFile.type.startsWith('video/') && selectedFile.size > 60 * 1024 * 1024) { mediaStatus.textContent = 'El video supera el límite de 60 MB.'; return; }
  formData.set('file', await compressImage(selectedFile));
  const response = await fetch('/api/media', { method: 'POST', credentials: 'same-origin', body: formData });
  const result = await response.json();
  mediaStatus.textContent = response.ok ? 'Archivo cargado y pendiente de publicación.' : (result.error || 'No se pudo cargar el archivo.');
  if (response.ok) { mediaForm.reset(); await loadMedia(); }
});

boot();
