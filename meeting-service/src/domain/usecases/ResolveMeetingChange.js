const GoogleCalendarClient = require('../../adapters/output/GoogleCalendarClient');
const GoogleOAuthRepository = require('../../adapters/output/GoogleOAuthRepository');

class ResolveMeetingChange {
  constructor(meetingRepository, roomRepository) {
    this.meetingRepository = meetingRepository;
    this.roomRepository = roomRepository;
    this.oauthRepository = new GoogleOAuthRepository();
  }

  async execute(meetingId, accept) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (accept) {
      // Apply the proposed changes
      if (meeting.change_request_data) {
        meeting.date = meeting.change_request_data.proposed_date;
        meeting.start_time = meeting.change_request_data.proposed_start_time;
        meeting.end_time = meeting.change_request_data.proposed_end_time;

        // Re-validate room availability for PRESENTIEL meetings
        if (meeting.type === 'PRESENTIEL' && meeting.room_id) {
          const conflictingMeetings = await this.meetingRepository.findConflictingMeetings(
            meeting.room_id,
            meeting.date,
            meeting.start_time,
            meeting.end_time,
            meeting.id // Exclude current meeting from conflict check
          );

          if (conflictingMeetings.length > 0) {
            throw new Error('Room unavailable for the requested time slot');
          }
        }

        // Update Google Calendar event if applicable
        if (meeting.google_event_id && meeting.meeting_platform === 'GOOGLE_MEET') {
          try {
            const tokens = await this.oauthRepository.getTokens(meeting.created_by_id);
            if (tokens) {
              const oauth2Client = await GoogleCalendarClient.getValidClient(
                tokens,
                meeting.created_by_id,
                this.oauthRepository
              );
              await GoogleCalendarClient.updateMeetEvent(oauth2Client, meeting.google_event_id, {
                title: meeting.title,
                description: meeting.description || '',
                date: meeting.date,
                startTime: meeting.start_time,
                endTime: meeting.end_time,
              });
            }
          } catch (err) {
            console.warn('Failed to update Google Calendar event:', err.message);
          }
        }
      }
      meeting.status = 'CONFIRMED';
    } else {
      // Reject the change request, restore previous status
      meeting.status = 'CONFIRMED';
    }

    meeting.change_request_data = null;
    return await this.meetingRepository.update(meeting);
  }
}

module.exports = ResolveMeetingChange;
