class GetMyMeetings {
  constructor(meetingRepository) {
    this.meetingRepository = meetingRepository;
  }

  async execute(userId) {
    return await this.meetingRepository.findByCreatorId(userId);
  }
}

module.exports = GetMyMeetings;
