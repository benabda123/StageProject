class ApproveMeeting {
  constructor(meetingRepository) {
    this.meetingRepository = meetingRepository;
  }

  async execute(meetingId) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    meeting.status = 'CONFIRMED';
    return await this.meetingRepository.update(meeting);
  }
}

module.exports = ApproveMeeting;
