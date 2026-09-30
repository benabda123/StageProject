const fetch = require('node-fetch');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8084';
const DEPARTMENT_SERVICE_URL = process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:8083';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function getEmployees() {
  const response = await fetch(`${AUTH_SERVICE_URL}/internal/employees`, {
    headers: {
      'x-internal-api-key': INTERNAL_API_KEY
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch employees from auth-service: ${response.status} - ${text}`);
  }
  return await response.json();
}

async function getDepartments() {
  const response = await fetch(`${DEPARTMENT_SERVICE_URL}/departments`, {
    headers: {
      'x-internal-api-key': INTERNAL_API_KEY
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch departments: ${response.status} - ${text}`);
  }
  return await response.json();
}

module.exports = { getEmployees, getDepartments };
