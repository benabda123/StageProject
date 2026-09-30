class GetAllMeetings {
  constructor(meetingRepository) {
    this.meetingRepository = meetingRepository;
  }

  async execute(filters = {}) {
    return await this.meetingRepository.findAll(filters);
  }
}

module.exports = GetAllMeetings;
