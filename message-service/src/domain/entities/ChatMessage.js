class ChatMessage {
  constructor({ id, sender_id, sender_name, sender_role, recipient_id, employee_id, message, is_read, created_at }) {
    this.id = id;
    this.sender_id = sender_id;
    this.sender_name = sender_name;
    this.sender_role = sender_role || 'employee';
    this.recipient_id = recipient_id || 'admin';
    this.employee_id = employee_id;
    this.message = message;
    this.is_read = is_read ?? false;
    this.created_at = created_at;
  }
}

module.exports = ChatMessage;
