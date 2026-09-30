const fetch = require('node-fetch');

const LEAVE_SERVICE_URL = process.env.LEAVE_SERVICE_URL || 'http://leave-service:8086';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function getLeaveById(leaveId) {
  const response = await fetch(`${LEAVE_SERVICE_URL}/internal/leaves/${leaveId}`, {
    headers: {
      'x-internal-api-key': INTERNAL_API_KEY
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch leave ${leaveId}: ${response.status} - ${text}`);
  }
  return await response.json();
}

async function getPendingLeaves() {
  const response = await fetch(`${LEAVE_SERVICE_URL}/internal/leaves?status=pending`, {
    headers: {
      'x-internal-api-key': INTERNAL_API_KEY
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch pending leaves: ${response.status} - ${text}`);
  }
  return await response.json();
}

module.exports = { getLeaveById, getPendingLeaves };
