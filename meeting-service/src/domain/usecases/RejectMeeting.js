class RejectMeeting {
  constructor(meetingRepository) {
    this.meetingRepository = meetingRepository;
  }

  async execute(meetingId) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    meeting.status = 'REJECTED';
    return await this.meetingRepository.update(meeting);
  }
}

module.exports = RejectMeeting;
