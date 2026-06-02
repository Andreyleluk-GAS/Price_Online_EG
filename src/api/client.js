const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BASE_URL = `${API_BASE_URL}/api`;

async function request(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export function searchCars(query) {
  return request(`/cars?q=${encodeURIComponent(query)}`);
}

export function getAllCars() {
  return request('/cars?all=true');
}

export function getSystems(cylinders) {
  return request(`/systems?cylinders=${cylinders}`);
}

export function getTanks() {
  return request('/tanks');
}

export function getSettings() {
  return request('/settings/fuel');
}

export function getPriceItems() {
  return request('/price-items');
}

export function updateSettings(data) {
  return request('/settings/fuel', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function importPrices(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE_URL}/import`, {
    method: 'POST',
    body: formData,
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function importCars(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE_URL}/cars/import`, {
    method: 'POST',
    body: formData,
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
