class Notification {
  constructor({ id, user_id, title, message, type, status, created_at, read_at }) {
    this.id = id;
    this.user_id = user_id;
    this.title = title;
    this.message = message;
    this.type = type;
    this.status = status || 'UNREAD';
    this.created_at = created_at;
    this.read_at = read_at;

    this.validate();
  }

  validate() {
    const VALID_TYPES = ['TASK', 'LEAVE', 'MEETING', 'SYSTEM', 'EMPLOYEE', 'ANNOUNCEMENT'];
    const VALID_STATUSES = ['UNREAD', 'READ'];

    if (!this.title || this.title.trim() === '') {
      throw new Error('Title is required');
    }

    if (!this.message || this.message.trim() === '') {
      throw new Error('Message is required');
    }

    if (!VALID_TYPES.includes(this.type)) {
      throw new Error('Type must be one of: TASK, LEAVE, MEETING, SYSTEM, EMPLOYEE, ANNOUNCEMENT');
    }

    if (!VALID_STATUSES.includes(this.status)) {
      throw new Error('Status must be UNREAD or READ');
    }
  }
}

module.exports = Notification;
