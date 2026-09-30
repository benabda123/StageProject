const MeetingRoom = require('../entities/MeetingRoom');

class UpdateRoom {
  constructor(roomRepository) {
    this.roomRepository = roomRepository;
  }

  async execute(roomId, roomData) {
    const existingRoom = await this.roomRepository.findById(roomId);
    if (!existingRoom) {
      throw new Error('Room not found');
    }

    const updatedRoom = new MeetingRoom({
      ...existingRoom,
      ...roomData,
      id: roomId
    });

    return await this.roomRepository.update(updatedRoom);
  }
}

module.exports = UpdateRoom;
