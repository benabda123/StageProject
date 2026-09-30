import { useState, useEffect, useRef } from 'react';
import { getToken } from '../services/tokenStore';

const API_URL = 'http://localhost:8000/messages';

export default function AdminSupportChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchMessages(selectedEmployeeId);
      const interval = setInterval(() => fetchMessages(selectedEmployeeId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (!selectedEmployeeId && data.length > 0) {
          setSelectedEmployeeId(data[0].employee_id);
          setSelectedEmployeeName(data[0].sender_name);
        }
      }
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (employeeId) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/conversation/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmployeeId || sending) return;

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
          message: replyText,
          employee_id: selectedEmployeeId,
          recipient_id: selectedEmployeeId
        })
      });

      if (response.ok) {
        const sentMsg = await response.json();
        setMessages(prev => [...prev, sentMsg]);
        setReplyText('');
        fetchConversations();
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Erreur envoi réponse admin:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    (c.sender_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Messagerie Support Employés</h2>
        <p className="text-sm text-gray-500 mt-1">Répondez en direct aux questions et demandes des collaborateurs.</p>
      </div>

      {/* Chat Layout Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex">
        {/* Left Sidebar: Conversations List */}
        <div className="w-80 sm:w-96 border-r border-gray-100 flex flex-col bg-gray-50/50">
          {/* Search */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un employé..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#003366] transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400">Chargement des conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Aucune conversation trouvée</div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.employee_id === selectedEmployeeId;
                return (
                  <button
                    key={conv.employee_id}
                    onClick={() => {
                      setSelectedEmployeeId(conv.employee_id);
                      setSelectedEmployeeName(conv.sender_name);
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-[#003366]' : 'hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#003366] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                      {(conv.sender_name || 'E')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                          {conv.sender_name}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedEmployeeId ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#003366] text-white font-bold flex items-center justify-center text-sm">
                    {(selectedEmployeeName || 'E')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{selectedEmployeeName}</h3>
                    <p className="text-xs text-gray-400">ID: {selectedEmployeeId}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  En direct
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/40 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    Aucun message dans cette conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdminMsg = msg.sender_role === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[11px] text-gray-400 mb-1 px-1">
                          {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-xs sm:text-sm leading-relaxed ${
                            isAdminMsg
                              ? 'bg-[#003366] text-white rounded-br-none'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
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

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Répondre à ${selectedEmployeeName}...`}
                  className="flex-1 px-4 py-3 text-xs sm:text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-[#003366] transition-all"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="px-6 py-3 bg-[#003366] hover:bg-[#002244] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  Envoyer
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">forum</span>
              <p className="text-sm font-medium">Sélectionnez une conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
