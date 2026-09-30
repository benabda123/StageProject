const fetch = require('node-fetch');

const MEETING_SERVICE_URL = process.env.MEETING_SERVICE_URL || 'http://meeting-service:8088';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function getMeetings(employeeIds = []) {
  let url = `${MEETING_SERVICE_URL}/internal/meetings`;
  if (employeeIds && employeeIds.length > 0) {
    url += `?employeeIds=${encodeURIComponent(employeeIds.join(','))}`;
  }
  const response = await fetch(url, {
    headers: {
      'x-internal-api-key': INTERNAL_API_KEY
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch meetings from meeting-service: ${response.status} - ${text}`);
  }
  return await response.json();
}

module.exports = { getMeetings };
