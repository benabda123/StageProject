class DeleteRoom {
  constructor(roomRepository) {
    this.roomRepository = roomRepository;
  }

  async execute(roomId) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    await this.roomRepository.delete(roomId);
    return { message: 'Room deleted successfully' };
  }
}

module.exports = DeleteRoom;
