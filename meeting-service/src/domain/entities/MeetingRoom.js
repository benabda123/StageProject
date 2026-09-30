class MeetingRoom {
  constructor({ id, name, capacity, equipment, created_at, updated_at }) {
    this.id = id;
    this.name = name;
    this.capacity = capacity;
    this.equipment = equipment || [];
    this.created_at = created_at;
    this.updated_at = updated_at;

    this.validate();
  }

  validate() {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Room name is required');
    }

    if (!this.capacity || this.capacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }
  }
}

module.exports = MeetingRoom;
