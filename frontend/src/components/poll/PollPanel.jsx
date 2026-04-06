import { useState } from 'react';
import useRoomStore from '../../store/roomStore';
import useAuthStore from '../../store/authStore';
import { wsManager } from '../../utils/wsManager';
import { useToast } from '../common/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Plus, X, CheckCircle2 } from 'lucide-react';

export default function PollPanel() {
  const { polls, roomId, members } = useRoomStore();
  const { user } = useAuthStore();
  const toast = useToast();

  const isAdmin = members.find(m => m.userId === user?._id)?.role === 'admin';

  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [votedPolls, setVotedPolls] = useState(new Set());

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    const trimmedQ = question.trim();
    if (!trimmedQ) return toast.warning('Please enter a question');
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) return toast.warning('Add at least 2 options');

    wsManager.send('poll_create', { question: trimmedQ, options: validOptions }, roomId);
    setQuestion('');
    setOptions(['', '']);
    setShowCreate(false);
    toast.success('Poll created!');
  };

  const handleVote = (pollId, optionId) => {
    if (votedPolls.has(pollId)) return;
    wsManager.send('poll_vote', { pollId, optionId }, roomId);
    setVotedPolls(prev => new Set(prev).add(pollId));
  };

  const handleDeletePoll = (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll?")) return;
    wsManager.send('poll_delete', { pollId }, roomId);
  };

  const getTotalVotes = (poll) => poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  return (
    <div className="flex flex-col h-full bg-root overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2 text-white font-semibold">
          <BarChart2 className="w-5 h-5 text-primary" />
          Live Polls
          {polls.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold">{polls.length}</span>}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${showCreate ? 'bg-surface-elevated text-gray-400 hover:text-white' : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'}`}
        >
          {showCreate ? <><X className="w-4 h-4"/> Cancel</> : <><Plus className="w-4 h-4"/> New Poll</>}
        </button>
      </header>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border bg-surface-elevated p-6 overflow-hidden relative shadow-xl"
            onSubmit={handleCreatePoll}
          >
            <h3 className="font-bold text-white mb-4">Create a Poll</h3>
            <input
              type="text"
              placeholder="Ask a question… (e.g. Should we take a break?)"
              className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors mb-4"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              autoFocus
            />
            
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Options (2-6)</span>
            <div className="space-y-2 mb-4">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-4 py-2 bg-surface-input border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                    value={opt}
                    onChange={e => handleOptionChange(idx, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => handleRemoveOption(idx)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
                      <X className="w-5 h-5"/>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button 
                type="button" 
                onClick={handleAddOption}
                disabled={options.length >= 6}
                className="flex items-center gap-1.5 text-xs text-primary font-medium disabled:opacity-50 hover:underline"
              >
                <Plus className="w-4 h-4"/> Add option
              </button>
              <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                Create Poll
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {polls.length === 0 && !showCreate ? (
          <div className="m-auto flex flex-col items-center justify-center text-gray-500 max-w-sm text-center gap-4">
            <BarChart2 className="w-12 h-12 opacity-20" />
            <p>No polls yet. Create one to get rapid feedback from your team!</p>
          </div>
        ) : (
          [...polls].reverse().map(poll => {
            const totalVotes = getTotalVotes(poll);
            const hasVoted = votedPolls.has(poll.pollId);

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                key={poll.pollId} 
                className="bg-surface border border-border rounded-2xl p-6 relative group/poll"
              >
                {isAdmin && (
                  <button 
                    onClick={() => handleDeletePoll(poll.pollId)}
                    className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover/poll:opacity-100"
                    title="Delete Poll"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <h4 className="text-lg font-bold text-white mb-2 pr-6">{poll.question}</h4>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-400">{totalVotes} vote{totalVotes!==1?'s':''}</span>
                  {hasVoted && <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3.5 h-3.5"/> Voted</span>}
                </div>

                <div className="space-y-3">
                  {poll.options.map(opt => {
                    const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <div 
                        key={opt.id}
                        onClick={() => !hasVoted && handleVote(poll.pollId, opt.id)}
                        className={`relative overflow-hidden group rounded-xl border border-border ${hasVoted ? 'bg-surface-elevated' : 'bg-surface cursor-pointer hover:border-primary hover:bg-primary/5 transition-all'}`}
                      >
                        {/* Progress Bar */}
                        <motion.div 
                          className="absolute inset-y-0 left-0 bg-primary/20 z-0"
                          initial={{ width: 0 }}
                          animate={{ width: hasVoted ? `${percent}%` : 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                        
                        <div className="relative z-10 px-4 py-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-200">{opt.text}</span>
                          {hasVoted && (
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-gray-400">{opt.votes}</span>
                              <span className="font-bold text-primary w-8 text-right">{percent}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
}
