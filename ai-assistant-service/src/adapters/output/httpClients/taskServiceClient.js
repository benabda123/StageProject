const fetch = require('node-fetch');

const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || 'http://task-service:8087';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function getTasks() {
  const response = await fetch(`${TASK_SERVICE_URL}/internal/tasks`, {
    headers: {
      'x-internal-api-key': INTERNAL_API_KEY
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch tasks from task-service: ${response.status} - ${text}`);
  }
  return await response.json();
}

module.exports = { getTasks };
