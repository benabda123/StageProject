import { useState, useEffect } from 'react';
import { createPoll, getAllPolls, getPollResults, closePoll, deletePoll } from '../services/pollService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDeadline(d) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TimeRemaining({ deadline, status }) {
  const ms = new Date(deadline) - new Date();
  if (status === 'closed' || ms <= 0) {
    return <span className="text-xs text-gray-400">Fermé</span>;
  }
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return <span className="text-xs text-amber-600 font-semibold">⏱ {days}j restants</span>;
  if (hours > 0) return <span className="text-xs text-orange-600 font-semibold">⏱ {hours}h restantes</span>;
  return <span className="text-xs text-red-600 font-semibold">⏱ Expire bientôt</span>;
}

// ─── Bar chart pour les résultats ─────────────────────────────────────────────
function ResultBar({ option, totalVotes, isWinner }) {
  return (
    <div className={`rounded-xl p-3 border transition-all ${
      isWinner ? 'bg-[#003366]/8 border-[#003366]/20' : 'bg-white/[0.03] border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-white/80 flex items-center gap-1.5">
          {isWinner && <span className="text-yellow-400 text-base">🏆</span>}
          {option.text}
        </span>
        <span className="text-sm font-bold text-white">{option.count} <span className="text-white/50 font-normal">({option.percentage}%)</span></span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${option.percentage}%`,
            background: isWinner ? '#60a5fa' : 'rgba(255,255,255,0.3)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Modal Résultats ──────────────────────────────────────────────────────────
function ResultsModal({ pollId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPollResults(pollId)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [pollId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f1e35] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Résultats du sondage</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : !data ? (
            <p className="text-white/50 text-center py-8">Erreur de chargement</p>
          ) : (
            <>
              <p className="text-lg font-bold text-white mb-1">{data.poll.title}</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-white/50">{data.totalVotes} vote{data.totalVotes !== 1 ? 's' : ''}</span>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs text-white/50">Limite : {formatDeadline(data.poll.deadline)}</span>
              </div>
              {data.totalVotes === 0 ? (
                <div className="text-center py-6 text-white/40">
                  <span className="material-symbols-outlined text-4xl">how_to_vote</span>
                  <p className="mt-2 text-sm">Aucun vote pour l'instant</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.results.map(opt => (
                    <ResultBar
                      key={opt.optionId}
                      option={opt}
                      totalVotes={data.totalVotes}
                      isWinner={data.winner?.optionId === opt.optionId}
                    />
                  ))}
                </div>
              )}

              {/* Votants (si non anonyme) */}
              {data.voters?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Qui a voté</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.voters.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/70">
                        {v.employeeUsername}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire de création ───────────────────────────────────────────────────
function CreatePollForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    options: ['', ''],
    deadline: '',
    isAnonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addOption = () => {
    if (form.options.length < 8) setForm(f => ({ ...f, options: [...f.options, ''] }));
  };

  const removeOption = (i) => {
    if (form.options.length > 2) {
      setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
    }
  };

  const setOption = (i, val) => {
    setForm(f => {
      const opts = [...f.options];
      opts[i] = val;
      return { ...f, options: opts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        options: form.options.filter(o => o.trim()),
        deadline: new Date(form.deadline).toISOString(),
        isAnonymous: form.isAnonymous,
      };
      const res = await createPoll(payload);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/50 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f1e35] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0f1e35] z-10">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">add_box</span>
            Nouveau sondage
          </h2>
          <button onClick={onCancel} className="text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-2 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
              Titre <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Quelle heure pour la réunion d'équipe ?" className={inputCls} required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Contexte ou informations supplémentaires..." className={inputCls} />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
              Options <span className="text-red-400">*</span>
              <span className="text-white/30 font-normal ml-1">(min 2, max 8)</span>
            </label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-white/30 text-xs w-4 shrink-0 text-right">{i + 1}.</span>
                  <input type="text" value={opt} onChange={e => setOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`} className={inputCls} required />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="text-white/30 hover:text-red-400 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-base">remove_circle</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {form.options.length < 8 && (
              <button type="button" onClick={addOption}
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <span className="material-symbols-outlined text-base">add_circle</span>
                Ajouter une option
              </button>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
              Date limite <span className="text-red-400">*</span>
            </label>
            <input type="datetime-local" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className={inputCls} required />
          </div>

          {/* Anonyme */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isAnonymous ? 'bg-blue-500' : 'bg-white/10'}`}
              onClick={() => setForm(f => ({ ...f, isAnonymous: !f.isAnonymous }))}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/70 group-hover:text-white transition-colors">
              Votes anonymes — les noms des votants ne seront pas visibles
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création...</>
              ) : (
                <><span className="material-symbols-outlined text-base">send</span> Créer et notifier</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PollManagement() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchPolls(); }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const res = await getAllPolls();
      setPolls(res.data);
    } catch (err) {
      setError('Erreur de chargement des sondages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (poll) => {
    setShowCreate(false);
    setPolls(prev => [{ ...poll, totalVotes: 0, isExpired: false }, ...prev]);
  };

  const handleClose = async (id) => {
    setActionLoading(id);
    try {
      await closePoll(id);
      setPolls(prev => prev.map(p => p.id === id ? { ...p, status: 'closed' } : p));
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce sondage et tous ses votes ?')) return;
    setActionLoading(id);
    try {
      await deletePoll(id);
      setPolls(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = polls.filter(p => p.status === 'active').length;
  const closedCount = polls.filter(p => p.status === 'closed').length;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sondages</h1>
          <p className="text-sm text-white/40 mt-1">Créez des sondages et consultez les résultats en temps réel</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/30">
          <span className="material-symbols-outlined text-base">add</span>
          Nouveau sondage
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: 'bar_chart', label: 'Total',   value: polls.length,  color: '#60a5fa' },
          { icon: 'how_to_vote', label: 'Actifs', value: activeCount,   color: '#34d399' },
          { icon: 'lock',     label: 'Fermés',    value: closedCount,   color: '#9ca3af' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-white/[0.04] backdrop-blur rounded-2xl border border-white/10 p-4 text-center">
            <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
            <p className="text-xl font-bold text-white mt-1">{value}</p>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : polls.length === 0 ? (
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-white/20">how_to_vote</span>
          <p className="text-white/40 mt-3 font-medium">Aucun sondage créé</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Créer le premier sondage
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map(poll => {
            const isActive = poll.status === 'active' && !poll.isExpired;
            const statusCfg = isActive
              ? { dot: 'bg-green-400', text: 'text-green-400', label: 'Actif' }
              : { dot: 'bg-gray-500', text: 'text-gray-400', label: 'Fermé' };

            return (
              <div key={poll.id} className="bg-white/[0.04] backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:bg-white/[0.06] transition-all">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                      <span className={`text-xs font-semibold ${statusCfg.text}`}>{statusCfg.label}</span>
                      {poll.isAnonymous && (
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <span className="material-symbols-outlined text-sm">visibility_off</span>Anonyme
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white truncate">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-sm text-white/50 mt-0.5 line-clamp-1">{poll.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-white/40">
                      <span>{poll.options?.length || 0} options</span>
                      <span>·</span>
                      <span>{poll.totalVotes || 0} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>Créé par {poll.createdBy}</span>
                      <span>·</span>
                      <TimeRemaining deadline={poll.deadline} status={poll.status} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setSelectedPollId(poll.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-sm">bar_chart</span>
                      Résultats
                    </button>
                    {isActive && (
                      <button onClick={() => handleClose(poll.id)}
                        disabled={actionLoading === poll.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        Fermer
                      </button>
                    )}
                    <button onClick={() => handleDelete(poll.id)}
                      disabled={actionLoading === poll.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs rounded-lg transition-colors disabled:opacity-50">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreatePollForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}
      {selectedPollId && <ResultsModal pollId={selectedPollId} onClose={() => setSelectedPollId(null)} />}
    </div>
  );
}
