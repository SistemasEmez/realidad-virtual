const model = document.getElementById('model');
const status = document.getElementById('status');
let latestConfig;
let viewerReady = false;
let currentSource = '';

function showStatus(message, isError = false) {
  status.textContent = message;
  status.hidden = false;
  status.classList.toggle('is-error', isError);
}

function applyConfig() {
  if (!viewerReady || !latestConfig) return;
  const config = latestConfig;
  if (currentSource !== config.model) {
    currentSource = config.model;
    model.style.visibility = 'hidden';
    showStatus('Cargando ' + config.modelName + '…');
    model.setAttribute('src', config.model);
    model.setAttribute('alt', config.modelName || 'Modelo 3D de la experiencia');
    model.cameraOrbit = '30deg 75deg auto';
  }
  const ratio = config.scale / 1000;
  model.scale = [ratio, ratio, ratio].join(' ');
  model.orientation = config.rz + 'deg ' + config.ry + 'deg ' + config.rx + 'deg';
  model.autoRotate = Boolean(config.spin);
}

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data.type === 'config') {
    latestConfig = event.data.config;
    applyConfig();
  } else if (event.data.type === 'reset' && viewerReady) {
    model.cameraOrbit = '30deg 75deg auto';
    model.jumpCameraToGoal();
  }
});

model.addEventListener('load', () => {
  model.style.visibility = 'visible';
  status.hidden = true;
});
model.addEventListener('error', () => {
  const message = 'No se pudo abrir el modelo. Revisa que el archivo GLB sea válido y tenga sus texturas integradas.';
  model.style.visibility = 'hidden';
  showStatus(message, true);
  parent.postMessage({type: 'error', message}, location.origin);
});

// Config can arrive before the custom element or after the iframe loads.
// Retain the latest model and announce readiness once its setters are available.
customElements.whenDefined('model-viewer').then(() => {
  viewerReady = true;
  applyConfig();
  parent.postMessage({type: 'ready'}, location.origin);
});
setTimeout(() => {
  if (!viewerReady) showStatus('El visor 3D necesita conexión a internet. Recarga cuando tengas conexión.', true);
}, 15000);
