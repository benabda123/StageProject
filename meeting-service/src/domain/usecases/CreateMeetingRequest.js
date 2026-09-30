const Meeting = require('../entities/Meeting');
const GoogleCalendarClient = require('../../adapters/output/GoogleCalendarClient');
const GoogleOAuthRepository = require('../../adapters/output/GoogleOAuthRepository');

class CreateMeetingRequest {
  constructor(meetingRepository, roomRepository) {
    this.meetingRepository = meetingRepository;
    this.roomRepository = roomRepository;
    this.oauthRepository = new GoogleOAuthRepository();
  }

  async execute(meetingData, userId, username, requestingUserRole) {
    const initialStatus = requestingUserRole === 'admin' ? 'CONFIRMED' : 'PENDING';

    let finalMeetingData = { ...meetingData };

    // Google Meet creation
    if (meetingData.type === 'ONLINE' && meetingData.meeting_platform === 'GOOGLE_MEET') {
      const tokens = await this.oauthRepository.getTokens(userId);
      if (!tokens) {
        throw new Error('Connectez d\'abord votre compte Google Calendar depuis l\'interface web');
      }

      const oauth2Client = await GoogleCalendarClient.getValidClient(tokens, userId, this.oauthRepository);

      const attendeeEmails = await this._resolveAttendeeEmails(meetingData.participants);

      const { eventId, meetLink } = await GoogleCalendarClient.createMeetEvent(oauth2Client, {
        title: meetingData.title,
        description: meetingData.description || '',
        date: meetingData.date,
        startTime: meetingData.start_time,
        endTime: meetingData.end_time,
        attendeeEmails,
      });

      finalMeetingData.meeting_link = meetLink;
      finalMeetingData.google_event_id = eventId;
    }

    const meeting = new Meeting({
      ...finalMeetingData,
      created_by_id: userId,
      created_by_username: username,
      status: initialStatus,
    });

    if (meeting.type === 'PRESENTIEL') {
      const room = await this.roomRepository.findById(meeting.room_id);
      if (!room) {
        throw new Error('Room not found');
      }

      if (meeting.participants && meeting.participants.length > room.capacity) {
        throw new Error('Number of participants exceeds room capacity');
      }

      const conflictingMeetings = await this.meetingRepository.findConflictingMeetings(
        meeting.room_id,
        meeting.date,
        meeting.start_time,
        meeting.end_time
      );

      if (conflictingMeetings.length > 0) {
        throw new Error('Room unavailable for this time slot');
      }
    }

    return await this.meetingRepository.create(meeting);
  }

  async _resolveAttendeeEmails(participants) {
    if (!participants || participants.length === 0) return [];

    try {
      const fetch = require('node-fetch');
      const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8084';
      const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

      const response = await fetch(`${AUTH_SERVICE_URL}/internal/employees`, {
        headers: { 'x-internal-api-key': INTERNAL_API_KEY }
      });

      if (!response.ok) {
        console.warn('Failed to fetch employees for Google Meet attendees');
        return [];
      }

      const employees = await response.json();
      const emails = [];

      for (const participantId of participants) {
        const emp = employees.find(e => e.id === participantId || e.username === participantId);
        if (emp && emp.email) {
          emails.push(emp.email);
        } else if (emp && emp.attributes?.email) {
          const email = Array.isArray(emp.attributes.email) ? emp.attributes.email[0] : emp.attributes.email;
          emails.push(email);
        }
      }

      return emails;
    } catch (err) {
      console.warn('Error resolving attendee emails:', err.message);
      return [];
    }
  }
}

module.exports = CreateMeetingRequest;
