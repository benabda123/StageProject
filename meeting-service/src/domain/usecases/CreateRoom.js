const MeetingRoom = require('../entities/MeetingRoom');

class CreateRoom {
  constructor(roomRepository) {
    this.roomRepository = roomRepository;
  }

  async execute(roomData) {
    const room = new MeetingRoom(roomData);
    return await this.roomRepository.create(room);
  }
}

module.exports = CreateRoom;
