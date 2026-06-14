const ENDPOINTS = [
  { method: 'GET', path: '/blocks/latest', name: 'Latest Block', category: 'Blocks' },
  { method: 'GET', path: '/blocks/{id}', name: 'Get Block', category: 'Blocks', params: ['id'] },
  { method: 'GET', path: '/accounts/{account}/history', name: 'Account History', category: 'Accounts', params: ['account', 'op_type', 'counterparty', 'from', 'to', 'limit', 'cursor'] },
  { method: 'GET', path: '/auth/nonce', name: 'Get Auth Nonce', category: 'Auth' },
  { method: 'GET', path: '/count_ops/all', name: 'Count All Ops', category: 'Counts' },
  { method: 'GET', path: '/count_ops/series', name: 'Op Count Series', category: 'Counts', params: ['op_type', 'account', 'hours'] },
  { method: 'GET', path: '/count_ops/{operation_type}', name: 'Count By Type', category: 'Counts', params: ['operation_type', 'account'] },
  { method: 'GET', path: '/profile/{account}', name: 'Account Profile', category: 'Profile', params: ['account'] },
  { method: 'GET', path: '/posts', name: 'Get Posts', category: 'Posts', params: ['limit', 'cursor'] },
  { method: 'GET', path: '/posts/{id}', name: 'Get Post', category: 'Posts', params: ['id'] },
  { method: 'GET', path: '/shares/{post_id}', name: 'Post Shares', category: 'Shares', params: ['post_id', 'limit', 'cursor'] },
  { method: 'GET', path: '/sitemap/posts', name: 'Sitemap Posts', category: 'Sitemap', params: ['page', 'limit'] },
  { method: 'GET', path: '/telegram/top_posts', name: 'TG Top Posts', category: 'Telegram', params: ['days', 'limit'] },
  { method: 'GET', path: '/telegram/top_accounts', name: 'TG Top Accounts', category: 'Telegram', params: ['days', 'limit'] },
  { method: 'GET', path: '/voice/top_posts', name: 'Voice Top Posts', category: 'Voice', params: ['days', 'limit'] },
  { method: 'GET', path: '/voice/top_accounts', name: 'Voice Top Accounts', category: 'Voice', params: ['days', 'limit'] },
  { method: 'POST', path: '/webhooks', name: 'Register Webhook', category: 'Webhooks', params: ['url', 'secret', 'op_type_filter', 'account_filter'] },
  { method: 'GET', path: '/webhooks', name: 'List Webhooks', category: 'Webhooks' },
  { method: 'DELETE', path: '/webhooks/{id}', name: 'Delete Webhook', category: 'Webhooks', params: ['id'] },
  { method: 'WebSocket', path: '/ws/ops', name: 'Op Stream', category: 'WebSocket', params: ['op_type', 'account'] },
];

let currentEndpoint = null;
let wsConnection = null;

function initUI() {
  renderEndpointList();
  selectEndpoint(ENDPOINTS[0]);
}

function renderEndpointList() {
  const list = document.getElementById('endpoint-list');
  const grouped = {};

  ENDPOINTS.forEach(ep => {
    if (!grouped[ep.category]) grouped[ep.category] = [];
    grouped[ep.category].push(ep);
  });

  Object.entries(grouped).forEach(([category, endpoints]) => {
    const header = document.createElement('div');
    header.style.cssText = 'font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin-top: 16px; margin-bottom: 8px;';
    header.textContent = category;
    list.appendChild(header);

    endpoints.forEach(ep => {
      const btn = document.createElement('button');
      btn.className = 'endpoint-btn';
      btn.innerHTML = '';
      const method = document.createElement('span');
      method.className = 'method';
      method.textContent = ep.method;
      const path = document.createElement('span');
      path.textContent = ep.path;
      btn.appendChild(method);
      btn.appendChild(path);
      btn.addEventListener('click', () => selectEndpoint(ep, btn));
      list.appendChild(btn);
    });
  });
}

function selectEndpoint(ep, btnEl) {
  currentEndpoint = ep;
  document.querySelectorAll('.endpoint-btn').forEach(btn => btn.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  renderRequestForm();
  clearResponse();
}

function renderRequestForm() {
  const ep = currentEndpoint;
  const form = document.getElementById('request-form');
  form.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = ep.method + ' ' + ep.path;
  form.appendChild(title);

  const pathInput = document.createElement('div');
  pathInput.className = 'form-group';
  const pathLabel = document.createElement('label');
  pathLabel.textContent = 'Endpoint';
  const pathField = document.createElement('input');
  pathField.type = 'text';
  pathField.id = 'endpoint-path';
  pathField.value = ep.path;
  pathField.readOnly = true;
  pathInput.appendChild(pathLabel);
  pathInput.appendChild(pathField);
  form.appendChild(pathInput);

  if (ep.params && ep.params.length > 0) {
    const paramsTitle = document.createElement('h4');
    paramsTitle.textContent = 'Parameters';
    paramsTitle.style.cssText = 'font-size: 13px; font-weight: 500; margin: 16px 0 12px; color: #333;';
    form.appendChild(paramsTitle);

    ep.params.forEach(param => {
      const group = document.createElement('div');
      group.className = 'form-group';
      const label = document.createElement('label');
      label.textContent = param;
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'param-' + param;
      input.placeholder = 'Enter ' + param;
      group.appendChild(label);
      group.appendChild(input);
      form.appendChild(group);
    });
  }

  if (ep.method === 'POST') {
    const bodyGroup = document.createElement('div');
    bodyGroup.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = 'Request Body (JSON)';
    const textarea = document.createElement('textarea');
    textarea.id = 'request-body';
    textarea.placeholder = '{}';
    bodyGroup.appendChild(label);
    bodyGroup.appendChild(textarea);
    form.appendChild(bodyGroup);
  }

  const buttons = document.createElement('div');
  buttons.className = 'button-group';

  if (ep.method === 'WebSocket') {
    const connectBtn = document.createElement('button');
    connectBtn.className = 'btn-primary';
    connectBtn.textContent = 'Connect';
    connectBtn.addEventListener('click', connectWebSocket);
    buttons.appendChild(connectBtn);

    const disconnectBtn = document.createElement('button');
    disconnectBtn.className = 'btn-secondary';
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.addEventListener('click', disconnectWebSocket);
    buttons.appendChild(disconnectBtn);
  } else {
    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn-primary';
    sendBtn.textContent = 'Send Request';
    sendBtn.addEventListener('click', sendRequest);
    buttons.appendChild(sendBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-secondary';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', clearResponse);
    buttons.appendChild(clearBtn);
  }

  form.appendChild(buttons);
}

function buildUrl() {
  let url = currentEndpoint.path;

  if (currentEndpoint.params) {
    currentEndpoint.params.forEach(param => {
      const value = document.getElementById('param-' + param)?.value || '';
      if (value && currentEndpoint.path.includes('{' + param + '}')) {
        url = url.replace('{' + param + '}', value);
      } else if (value && !currentEndpoint.path.includes('{' + param + '}')) {
        url += url.includes('?') ? '&' : '?';
        url += param + '=' + encodeURIComponent(value);
      }
    });
  }

  return url;
}

async function sendRequest() {
  const url = buildUrl();
  const method = currentEndpoint.method;
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (method === 'POST') {
    const bodyText = document.getElementById('request-body')?.value || '{}';
    try {
      options.body = JSON.stringify(JSON.parse(bodyText));
    } catch {
      showResponse('Invalid JSON in request body', 400);
      return;
    }
  }

  try {
    const loading = document.getElementById('response-output');
    if (loading) {
      const spinner = document.createElement('div');
      spinner.className = 'loading';
      loading.innerHTML = '';
      loading.appendChild(spinner);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    showResponse(data, response.status, response.headers.get('content-type'));
  } catch (error) {
    showResponse('Error: ' + error.message, 0);
  }
}

function showResponse(data, status, contentType) {
  const panel = document.getElementById('response-panel');
  panel.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'Response';
  panel.appendChild(title);

  if (status > 0) {
    const statusLine = document.createElement('div');
    statusLine.className = 'response-status';
    const label = document.createElement('span');
    label.className = 'response-status-label';
    label.textContent = 'Status:';
    const code = document.createElement('span');
    code.className = 'status-' + status;
    code.textContent = status;
    statusLine.appendChild(label);
    statusLine.appendChild(code);
    panel.appendChild(statusLine);
  }

  const output = document.createElement('div');
  output.id = 'response-output';
  if (typeof data === 'string') {
    output.textContent = data;
  } else {
    output.textContent = JSON.stringify(data, null, 2);
  }
  panel.appendChild(output);
}

function clearResponse() {
  const panel = document.getElementById('response-panel');
  panel.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = 'Response';
  const msg = document.createElement('p');
  msg.style.cssText = 'color: #999; font-size: 13px;';
  msg.textContent = 'Send a request to see the response';
  panel.appendChild(title);
  panel.appendChild(msg);
}

function connectWebSocket() {
  if (wsConnection) disconnectWebSocket();

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams();

  if (document.getElementById('param-op_type')) {
    const val = document.getElementById('param-op_type')?.value;
    if (val) params.append('op_type', val);
  }
  if (document.getElementById('param-account')) {
    const val = document.getElementById('param-account')?.value;
    if (val) params.append('account', val);
  }

  const url = protocol + '//' + window.location.host + '/ws/ops' + (params.toString() ? '?' + params : '');

  try {
    wsConnection = new WebSocket(url);
    wsConnection.onopen = () => logWsMessage('Connected', 'connected');
    wsConnection.onmessage = (e) => logWsMessage(e.data, 'message');
    wsConnection.onerror = (e) => logWsMessage('WebSocket error', 'disconnected');
    wsConnection.onclose = () => logWsMessage('Disconnected', 'disconnected');
  } catch (error) {
    logWsMessage('Error: ' + error.message, 'disconnected');
  }
}

function disconnectWebSocket() {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
}

function logWsMessage(text, type) {
  const output = document.getElementById('ws-output');
  const msg = document.createElement('div');
  msg.className = 'ws-message';
  const timestamp = document.createElement('span');
  timestamp.className = 'ws-timestamp';
  timestamp.textContent = new Date().toLocaleTimeString() + ' ';
  const content = document.createElement('span');
  content.className = 'ws-' + type;
  content.textContent = text;
  msg.appendChild(timestamp);
  msg.appendChild(content);
  output.appendChild(msg);
  output.scrollTop = output.scrollHeight;

  if (output.children.length > 100) {
    output.removeChild(output.firstChild);
  }
}

document.addEventListener('DOMContentLoaded', initUI);
