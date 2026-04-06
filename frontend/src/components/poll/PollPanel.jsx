// src/components/poll/PollPanel.jsx
import { useState } from 'react';
import useRoomStore from '../../store/roomStore';
import useAuthStore from '../../store/authStore';
import { wsManager } from '../../utils/wsManager';
import { useToast } from '../common/Toast';
import '../../styles/poll.css';

export default function PollPanel() {
  const { polls, roomId } = useRoomStore();
  const { user } = useAuthStore();
  const toast = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [votedPolls, setVotedPolls] = useState(new Set());

  // --- Create Poll ---
  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();

    const trimmedQ = question.trim();
    if (!trimmedQ) {
      toast.warning('Please enter a question');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.warning('Add at least 2 options');
      return;
    }

    wsManager.send('poll_create', {
      question: trimmedQ,
      options: validOptions,
    }, roomId);

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setShowCreate(false);
    toast.success('Poll created!');
  };

  // --- Vote ---
  const handleVote = (pollId, optionId) => {
    if (votedPolls.has(pollId)) return;

    wsManager.send('poll_vote', { pollId, optionId }, roomId);
    setVotedPolls(prev => new Set(prev).add(pollId));
  };

  // Calculate total votes for a poll
  const getTotalVotes = (poll) => {
    return poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  };

  return (
    <div className="poll-panel" id="poll-panel">
      {/* Header */}
      <div className="poll-header">
        <div className="poll-header-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Live Polls
          {polls.length > 0 && (
            <span className="room-tab-badge">{polls.length}</span>
          )}
        </div>
        <button
          className="poll-toggle-create"
          onClick={() => setShowCreate(!showCreate)}
          id="toggle-create-poll"
        >
          {showCreate ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Poll
            </>
          )}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form className="poll-create-form" onSubmit={handleCreatePoll}>
          <h3>Create a Poll</h3>
          <input
            className="poll-question-input"
            type="text"
            placeholder="Ask a question… (e.g. Should we take a break?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
            autoFocus
            id="poll-question-input"
          />
          <span className="poll-options-label">Options (2–6)</span>
          {options.map((opt, idx) => (
            <div key={idx} className="poll-option-row">
              <input
                className="poll-option-input"
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                maxLength={100}
                id={`poll-option-input-${idx}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className="poll-remove-option"
                  onClick={() => handleRemoveOption(idx)}
                  title="Remove option"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <div className="poll-form-actions">
            <button
              type="button"
              className="poll-add-option"
              onClick={handleAddOption}
              disabled={options.length >= 6}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add option
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm poll-submit-btn"
              id="submit-poll-btn"
            >
              Create Poll
            </button>
          </div>
        </form>
      )}

      {/* Poll List */}
      <div className="poll-list">
        {polls.length === 0 && !showCreate ? (
          <div className="poll-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <p>No polls yet. Create one to get feedback from your team!</p>
          </div>
        ) : (
          [...polls].reverse().map((poll) => {
            const totalVotes = getTotalVotes(poll);
            const hasVoted = votedPolls.has(poll.pollId);

            return (
              <div key={poll.pollId} className="poll-card" id={`poll-${poll.pollId}`}>
                <div className="poll-card-question">{poll.question}</div>
                <div className="poll-card-meta">
                  <div className="poll-total-votes">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                  </div>
                  {hasVoted && (
                    <span style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}>
                      ✓ Voted
                    </span>
                  )}
                </div>
                <div className="poll-options">
                  {poll.options.map((opt) => {
                    const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <div
                        key={opt.id}
                        className={`poll-option ${hasVoted ? 'disabled' : ''}`}
                        onClick={() => !hasVoted && handleVote(poll.pollId, opt.id)}
                        id={`vote-${poll.pollId}-${opt.id}`}
                      >
                        <div
                          className="poll-option-bar"
                          style={{ width: hasVoted ? `${percent}%` : '0%' }}
                        />
                        <div className="poll-option-content">
                          <span className="poll-option-text">{opt.text}</span>
                          <div className="poll-option-stats">
                            {hasVoted && (
                              <>
                                <span className="poll-option-percent">{percent}%</span>
                                <span className="poll-option-votes">({opt.votes})</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
