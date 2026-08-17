const statusDot = document.querySelector('#status-dot');
const statusTitle = document.querySelector('#status-title');
const statusCopy = document.querySelector('#status-copy');
const logoutButton = document.querySelector('#logout');
const dashboard = document.querySelector('#dashboard');
const metricsEmpty = document.querySelector('#metrics-empty');
const period = document.querySelector('#period');

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

boot();
