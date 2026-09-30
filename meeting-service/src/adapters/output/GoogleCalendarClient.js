const { google } = require('googleapis');

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getAuthUrl(state) {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state,
  });
}

async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

async function getValidClient(userTokens, userId, repository) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(userTokens);
  if (userTokens.expiry_date < Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await repository.updateTokens(userId, credentials);
    oauth2Client.setCredentials(credentials);
  }
  return oauth2Client;
}

async function createMeetEvent(oauth2Client, { title, description, date, startTime, endTime, attendeeEmails }) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: `${date}T${startTime}:00`, timeZone: 'Africa/Tunis' },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: 'Africa/Tunis' },
      attendees: attendeeEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `keystone-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });
  return { eventId: event.data.id, meetLink: event.data.hangoutLink };
}

async function updateMeetEvent(oauth2Client, eventId, { title, description, date, startTime, endTime }) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const event = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: `${date}T${startTime}:00`, timeZone: 'Africa/Tunis' },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: 'Africa/Tunis' },
    },
  });
  return event.data;
}

async function deleteMeetEvent(oauth2Client, eventId) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

module.exports = { getAuthUrl, exchangeCodeForTokens, getValidClient, createMeetEvent, updateMeetEvent, deleteMeetEvent };
