class RequestMeetingChange {
  constructor(meetingRepository) {
    this.meetingRepository = meetingRepository;
  }

  async execute(meetingId, changeData, userId) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Verify ownership
    if (meeting.created_by_id !== userId) {
      throw new Error('Only the meeting creator can request changes');
    }

    // Store change request data
    meeting.change_request_data = {
      proposed_date: changeData.date,
      proposed_start_time: changeData.start_time,
      proposed_end_time: changeData.end_time,
      reason: changeData.reason
    };
    meeting.status = 'CHANGE_REQUEST_PENDING';

    return await this.meetingRepository.update(meeting);
  }
}

module.exports = RequestMeetingChange;
