const statusDot = document.querySelector('#status-dot');
const statusTitle = document.querySelector('#status-title');
const statusCopy = document.querySelector('#status-copy');
const logoutButton = document.querySelector('#logout');

async function getSession() {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  return response.json();
}

async function checkHealth() {
  const response = await fetch('/api/admin/health', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('health');
  return response.json();
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

boot();
