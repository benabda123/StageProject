import { useState, useEffect, useCallback } from 'react';
import { getActivePolls, getPollResults, submitVote } from '../services/pollService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDeadline(d) {
  return new Date(d).toLocaleString('fr-FR', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function Countdown({ deadline }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const compute = () => {
      const ms = new Date(deadline) - new Date();
      if (ms <= 0) { setRemaining('Expiré'); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (d > 0) setRemaining(`${d}j ${h}h`);
      else if (h > 0) setRemaining(`${h}h ${m}m`);
      else setRemaining(`${m} min`);
    };
    compute();
    const t = setInterval(compute, 60000);
    return () => clearInterval(t);
  }, [deadline]);

  const ms = new Date(deadline) - new Date();
  const urgency = ms < 3600000 ? 'text-red-400' : ms < 86400000 ? 'text-amber-400' : 'text-white/50';

  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${urgency}`}>
      <span className="material-symbols-outlined text-sm">timer</span>
      {remaining}
    </span>
  );
}

// ─── Barre de résultat ────────────────────────────────────────────────────────
function ResultBar({ option, isWinner, myChoice }) {
  return (
    <div className={`rounded-xl p-3 border transition-all ${
      myChoice ? 'bg-blue-500/15 border-blue-400/30' :
      isWinner ? 'bg-white/[0.06] border-white/15' :
      'bg-white/[0.03] border-white/[0.06]'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/80 flex items-center gap-1.5">
          {isWinner && <span className="text-yellow-400">🏆</span>}
          {myChoice && <span className="text-blue-400 material-symbols-outlined text-sm">check_circle</span>}
          {option.text}
        </span>
        <span className="text-sm font-bold text-white/70">{option.percentage}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{
            width: `${option.percentage}%`,
            background: myChoice ? '#60a5fa' : isWinner ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
          }}
        />
      </div>
      <p className="text-xs text-white/30 mt-1">{option.count} vote{option.count !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ─── Carte de sondage ─────────────────────────────────────────────────────────
function PollCard({ poll, onVoted }) {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(poll.hasVoted);
  const [error, setError] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const loadResults = useCallback(async () => {
    setLoadingResults(true);
    try {
      const res = await getPollResults(poll.id);
      setResults(res.data);
    } catch {}
    setLoadingResults(false);
  }, [poll.id]);

  useEffect(() => {
    if (showResults) loadResults();
  }, [showResults, loadResults]);

  const handleVote = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitVote(poll.id, selected);
      await loadResults();
      setShowResults(true);
      onVoted(poll.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du vote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-snug">{poll.title}</h3>
            {poll.description && (
              <p className="text-sm text-white/50 mt-1">{poll.description}</p>
            )}
          </div>
          {poll.hasVoted && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-xs text-green-400 font-semibold shrink-0">
              <span className="material-symbols-outlined text-sm">check_circle</span> Voté
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-white/40">
          <Countdown deadline={poll.deadline} />
          <span>·</span>
          <span>Limite : {formatDeadline(poll.deadline)}</span>
          <span>·</span>
          <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
          {poll.isAnonymous && <><span>·</span><span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">visibility_off</span>Anonyme</span></>}
        </div>
      </div>

      {/* Corps */}
      <div className="px-5 py-4">
        {error && (
          <div className="mb-3 bg-red-500/15 border border-red-400/20 rounded-xl px-3 py-2 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Résultats (après vote) */}
        {showResults ? (
          loadingResults ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : results ? (
            <div className="space-y-2">
              {results.results.map(opt => (
                <ResultBar
                  key={opt.optionId}
                  option={opt}
                  isWinner={results.winner?.optionId === opt.optionId}
                  myChoice={results.myVote?.optionId === opt.optionId}
                />
              ))}
            </div>
          ) : null
        ) : (
          /* Options à voter */
          <div className="space-y-2">
            {poll.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selected === opt.id
                    ? 'bg-blue-500/25 border-blue-400/50 text-white font-semibold'
                    : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.07] hover:border-white/20'
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded-full border mr-2.5 align-middle transition-colors ${
                  selected === opt.id ? 'bg-blue-400 border-blue-300' : 'border-white/30'
                }`} />
                {opt.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!showResults && (
        <div className="px-5 pb-5">
          <button
            onClick={handleVote}
            disabled={!selected || submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Vote en cours...</>
            ) : (
              <><span className="material-symbols-outlined text-base">how_to_vote</span> Voter</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MyPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'voted'

  useEffect(() => { fetchPolls(); }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const res = await getActivePolls();
      setPolls(res.data);
    } catch (err) {
      setError('Impossible de charger les sondages');
    } finally {
      setLoading(false);
    }
  };

  const handleVoted = (pollId) => {
    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, hasVoted: true } : p));
  };

  const filtered = polls.filter(p => {
    if (filter === 'pending') return !p.hasVoted;
    if (filter === 'voted') return p.hasVoted;
    return true;
  });

  const pendingCount = polls.filter(p => !p.hasVoted).length;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Sondages</h1>
        <p className="text-sm text-white/40 mt-1">
          {pendingCount > 0
            ? `${pendingCount} sondage${pendingCount > 1 ? 's' : ''} en attente de votre vote`
            : 'Vous avez répondu à tous les sondages'}
        </p>
      </div>

      {/* Filtres */}
      {polls.length > 0 && (
        <div className="flex gap-1 bg-white/[0.05] p-1 rounded-xl w-fit">
          {[
            { key: 'all',     label: `Tous (${polls.length})` },
            { key: 'pending', label: `En attente (${pendingCount})` },
            { key: 'voted',   label: `Votés (${polls.length - pendingCount})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.key ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/15 border border-red-400/20 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
      ) : polls.length === 0 ? (
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-white/20">how_to_vote</span>
          <p className="text-white/40 mt-3 font-medium">Aucun sondage actif pour le moment</p>
          <p className="text-white/30 text-sm mt-1">Revenez plus tard</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">Aucun sondage dans cette catégorie</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(poll => (
            <PollCard key={poll.id} poll={poll} onVoted={handleVoted} />
          ))}
        </div>
      )}
    </div>
  );
}
