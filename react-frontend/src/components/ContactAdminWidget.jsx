import { useState, useEffect, useRef } from 'react';
import { getToken } from '../services/tokenStore';

const API_URL = 'http://localhost:8000/messages';

export default function ContactAdminWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/my-conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        if (!isOpen) {
          // Count unread admin messages
          const unread = data.filter(m => m.sender_role === 'admin' && !m.is_read).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.error('Erreur chargement messages chat:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMessage,
          recipient_id: 'admin'
        })
      });

      if (response.ok) {
        const sentMsg = await response.json();
        setMessages(prev => [...prev, sentMsg]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Erreur envoi message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col h-[480px] overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#003366] text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#003366] rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">Support Administrateur</h3>
                <p className="text-[11px] text-blue-200">En ligne • Répond rapidement</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3 text-sm">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#003366] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">chat</span>
                </div>
                <p className="font-medium text-gray-600 text-sm">Contactez l'administration</p>
                <p className="text-xs text-gray-400 mt-1">Posez votre question ci-dessous, un administrateur vous répondra.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isEmployee = msg.sender_role === 'employee';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isEmployee ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-gray-400 mb-1 px-1">
                      {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-xs sm:text-sm leading-relaxed ${
                        isEmployee
                          ? 'bg-[#003366] text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-[#003366] transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 rounded-xl bg-[#003366] text-white flex items-center justify-center hover:bg-[#002244] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#003366]/85 backdrop-blur-md text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-200 relative group"
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? 'expand_more' : 'chat_bubble'}
        </span>
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white font-bold text-xs rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
