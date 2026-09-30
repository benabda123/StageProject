class Meeting {
  constructor({ id, title, description, date, start_time, end_time, type, room_id, meeting_link, meeting_platform, google_event_id, participants, created_by_id, created_by_username, status, change_request_data, cancellation_reason, created_at, updated_at }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.date = date;
    this.start_time = start_time;
    this.end_time = end_time;
    this.type = type;
    this.room_id = room_id;
    this.meeting_link = meeting_link;
    this.meeting_platform = meeting_platform || null;
    this.google_event_id = google_event_id || null;
    this.participants = participants || [];
    this.created_by_id = created_by_id;
    this.created_by_username = created_by_username;
    this.status = status;
    this.change_request_data = change_request_data;
    this.cancellation_reason = cancellation_reason;
    this.created_at = created_at;
    this.updated_at = updated_at;

    this.validate();
  }

  validate() {
    const VALID_TYPES = ['ONLINE', 'PRESENTIEL'];
    const VALID_PLATFORMS = [null, 'GOOGLE_MEET'];

    if (!this.title || this.title.trim() === '') {
      throw new Error('Title is required');
    }

    if (!VALID_TYPES.includes(this.type)) {
      throw new Error('Type must be ONLINE or PRESENTIEL');
    }

    if (this.meeting_platform && !VALID_PLATFORMS.includes(this.meeting_platform)) {
      throw new Error('meeting_platform must be null or GOOGLE_MEET');
    }

    if (this.type === 'PRESENTIEL') {
      if (!this.room_id) {
        throw new Error('Room ID is required for PRESENTIEL meetings');
      }
      if (this.meeting_link) {
        throw new Error('Meeting link must be null for PRESENTIEL meetings');
      }
    }

    if (this.type === 'ONLINE') {
      if (this.meeting_platform !== 'GOOGLE_MEET') {
        if (!this.meeting_link || this.meeting_link.trim() === '') {
          throw new Error('Meeting link is required for ONLINE meetings');
        }
      }
      if (this.room_id) {
        throw new Error('Room ID must be null for ONLINE meetings');
      }
    }

    if (this.end_time <= this.start_time) {
      throw new Error('End time must be after start time');
    }
  }
}

module.exports = Meeting;
