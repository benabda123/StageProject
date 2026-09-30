const GoogleCalendarClient = require('../../adapters/output/GoogleCalendarClient');
const GoogleOAuthRepository = require('../../adapters/output/GoogleOAuthRepository');

class CancelMeeting {
  constructor(meetingRepository) {
    this.meetingRepository = meetingRepository;
    this.oauthRepository = new GoogleOAuthRepository();
  }

  async execute(meetingId, reason, userId) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.created_by_id !== userId) {
      throw new Error('Only the meeting creator can cancel the meeting');
    }

    // Delete Google Calendar event if it exists
    if (meeting.google_event_id && meeting.meeting_platform === 'GOOGLE_MEET') {
      try {
        const tokens = await this.oauthRepository.getTokens(meeting.created_by_id);
        if (tokens) {
          const oauth2Client = await GoogleCalendarClient.getValidClient(tokens, meeting.created_by_id, this.oauthRepository);
          await GoogleCalendarClient.deleteMeetEvent(oauth2Client, meeting.google_event_id);
        }
      } catch (err) {
        console.warn('Failed to delete Google Calendar event:', err.message);
      }
    }

    meeting.status = 'CANCELLED';
    meeting.cancellation_reason = reason;

    return await this.meetingRepository.update(meeting);
  }
}

module.exports = CancelMeeting;
