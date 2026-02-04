import React, { useState, useEffect } from "react";
import { apiGetEvents, apiGetTeams, apiGetPlayers } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";
import {
  loadLongTermConfig,
  getConfig,
  getLockStatus,
  getSubmission,
  submitLongTermBets,
  getUserPoints,
  getAuditLog,
} from "../mock/LongTermStore";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Countdown({ target }) {
  const [diff, setDiff] = useState(new Date(target) - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(target) - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (diff <= 0) return null;

  const days = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  if (days > 0) {
    return <span className="font-mono text-purple-300">{days}d {h}h</span>;
  }
  return <span className="font-mono text-purple-300">{h}h {m}m</span>;
}

export default function LongTermBets() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();

  const [config, setConfig] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [answers, setAnswers] = useState({});
  const [existing, setExisting] = useState(null);
  const [lockStatus, setLockStatus] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      loadLongTermConfig(),
      apiGetTeams(),
      apiGetPlayers(),
    ])
      .then(([cfg, t, p]) => {
        setConfig(cfg);
        setTeams(t);
        setPlayers(p);

        // Get lock status and existing submission
        const status = getLockStatus();
        setLockStatus(status);

        if (user) {
          const sub = getSubmission(identity.userId);
          if (sub) {
            setExisting(sub);
            setAnswers(sub.answers || {});
          }
          setUserPoints(getUserPoints(identity.userId));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  // Refresh lock status periodically
  useEffect(() => {
    const id = setInterval(() => {
      const status = getLockStatus();
      setLockStatus(status);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const questions = config?.questions || [];
  const isLocked = lockStatus?.isLocked && !lockStatus?.isReopened;
  const isReopened = lockStatus?.isReopened;
  const canEdit = lockStatus?.canEdit;
  const editCost = lockStatus?.editCost || 0;

  // Check if this is an edit (existing submission + reopened)
  const isEdit = existing && isReopened;

  function handleSingleAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleMultiAnswer(questionId, value, maxPicks) {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (current.includes(value)) {
        // Remove
        return { ...prev, [questionId]: current.filter((v) => v !== value) };
      } else if (current.length < maxPicks) {
        // Add
        return { ...prev, [questionId]: [...current, value] };
      }
      return prev; // Max reached
    });
  }

  async function handleSubmit() {
    if (!user) return toast.error("Sign in to submit");

    // Validate all questions answered
    for (const q of questions) {
      const answer = answers[q.questionId];
      if (q.type === "MULTI_TEAM_PICK") {
        if (!answer || answer.length !== q.pickCount) {
          return toast.error(`Please select exactly ${q.pickCount} teams for: ${q.text}`);
        }
      } else if (!answer) {
        return toast.error(`Please answer: ${q.text}`);
      }
    }

    // Check points if edit
    if (isEdit && userPoints < editCost) {
      return toast.error(`Insufficient points. Need ${editCost}, have ${userPoints}`);
    }

    setSubmitting(true);
    try {
      const result = submitLongTermBets(identity.userId, answers);

      setExisting({
        answers,
        submittedAt: result.submittedAt,
        isLocked: result.isLocked,
        editCount: result.editCount,
      });

      if (result.pointsDeducted > 0) {
        setUserPoints((prev) => prev - result.pointsDeducted);
        toast.success(`Predictions updated! ${result.pointsDeducted} points deducted.`);
      } else {
        toast.success("Long-term predictions submitted!");
      }

      // Refresh lock status
      setLockStatus(getLockStatus());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-purple-300 via-brand-400 to-pink-400 bg-clip-text text-transparent">
            Tournament Predictions
          </span>
        </h1>
        <p className="text-gray-500">Make your season-long predictions for the T20 World Cup 2026.</p>
      </div>

      {/* Lock Status Banner */}
      {lockStatus && (
        <div className={`card mb-6 ${
          isLocked ? "bg-red-950/30 border-red-800/40" :
          isReopened ? "bg-amber-950/30 border-amber-800/40" :
          "bg-purple-950/30 border-purple-800/40"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              {!lockStatus.isLocked && (
                <>
                  <p className="text-purple-400 font-semibold">Submissions Open</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Lock at: {formatDate(lockStatus.lockAt)}
                    {lockStatus.lockAt && (
                      <span className="ml-2">
                        (<Countdown target={lockStatus.lockAt} />)
                      </span>
                    )}
                  </p>
                </>
              )}
              {isLocked && !isReopened && (
                <>
                  <p className="text-red-400 font-semibold">Submissions Locked</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Locked since {formatDate(lockStatus.lockAt)}
                  </p>
                </>
              )}
              {isReopened && (
                <>
                  <p className="text-amber-400 font-semibold">Editing Reopened (Paid)</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Each save costs <span className="text-amber-300">{editCost} points</span>
                  </p>
                </>
              )}
            </div>
            {user && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Your Points</p>
                <p className="text-lg font-bold text-gray-200">{userPoints}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest CTA */}
      {!user && (
        <div className="card mb-6 text-center py-6 bg-brand-950/40 border-brand-800/40">
          <p className="text-brand-300">Sign in to submit your tournament predictions</p>
        </div>
      )}

      {/* Existing Submission Banner */}
      {existing && (
        <div className="card mb-6 bg-emerald-950/20 border-emerald-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 font-semibold">
                {existing.isLocked ? "Predictions Locked" : "Predictions Submitted"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Submitted at {new Date(existing.submittedAt).toLocaleString()}
                {existing.editCount > 0 && (
                  <span className="text-amber-400 ml-2">({existing.editCount} edits)</span>
                )}
              </p>
            </div>
            {isReopened && (
              <span className="px-3 py-1 bg-amber-900/50 text-amber-300 rounded-full text-sm">
                Edit available ({editCost} pts)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.questionId}
            question={q}
            index={i}
            teams={teams}
            players={players}
            answer={answers[q.questionId]}
            onSingleAnswer={(v) => handleSingleAnswer(q.questionId, v)}
            onMultiAnswer={(v) => handleMultiAnswer(q.questionId, v, q.pickCount)}
            disabled={(!canEdit && !isReopened) || !user}
          />
        ))}
      </div>

      {/* Submit / Edit Button */}
      {user && (canEdit || isReopened) && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-lg px-10 py-4"
          >
            {submitting && <Spinner size="sm" className="text-white inline mr-2" />}
            {isEdit ? `Update Predictions (-${editCost} pts)` : existing ? "Update Predictions" : "Lock Predictions"}
          </button>
          {!existing && !isReopened && (
            <p className="text-gray-600 text-xs mt-2">Once locked, you cannot change your answers.</p>
          )}
          {isEdit && (
            <p className="text-amber-500 text-xs mt-2">
              Warning: Updating will deduct {editCost} points from your balance.
            </p>
          )}
        </div>
      )}

      {/* Cannot Edit */}
      {user && !canEdit && !isReopened && !existing && (
        <div className="mt-8 card text-center bg-gray-900/50 border-gray-700">
          <p className="text-gray-400">Submissions are closed</p>
          <p className="text-gray-600 text-sm mt-1">You missed the deadline to submit predictions.</p>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, index, teams, players, answer, onSingleAnswer, onMultiAnswer, disabled }) {
  const q = question;

  // Build options based on type
  const getOptions = () => {
    if (q.type === "TEAM_PICK" || q.type === "MULTI_TEAM_PICK") {
      return teams.map((t) => ({
        value: t.teamId,
        label: t.name || t.shortName,
        color: t.color,
      }));
    }
    if (q.type === "PLAYER_PICK") {
      return players.map((p) => ({
        value: p.playerId,
        label: p.name,
        team: p.teamId,
      }));
    }
    return [];
  };

  const options = getOptions();

  return (
    <div className="card animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-gray-100 text-sm flex-1">
          <span className="text-purple-400 mr-2">Q{index + 1}.</span>
          {q.text}
        </h3>
        <span className="text-xs text-emerald-400 ml-3 whitespace-nowrap">+{q.points} pts</span>
      </div>

      {/* Single Team Pick */}
      {q.type === "TEAM_PICK" && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className={`px-4 py-2 rounded-lg text-sm cursor-pointer border transition-all ${
                answer === opt.value
                  ? "bg-purple-600/30 border-purple-600 text-purple-200"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              <input
                type="radio"
                name={q.questionId}
                value={opt.value}
                checked={answer === opt.value}
                onChange={() => onSingleAnswer(opt.value)}
                disabled={disabled}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {/* Multi Team Pick (e.g., semis, finals) */}
      {q.type === "MULTI_TEAM_PICK" && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Select {q.pickCount} teams (any order).
            {answer?.length > 0 && (
              <span className="text-purple-400 ml-2">{answer.length}/{q.pickCount} selected</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const selected = answer?.includes(opt.value);
              const atMax = answer?.length >= q.pickCount && !selected;
              return (
                <label
                  key={opt.value}
                  className={`px-4 py-2 rounded-lg text-sm cursor-pointer border transition-all ${
                    selected
                      ? "bg-purple-600/30 border-purple-600 text-purple-200"
                      : atMax
                      ? "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                  } ${disabled ? "pointer-events-none opacity-70" : ""}`}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={selected}
                    onChange={() => onMultiAnswer(opt.value)}
                    disabled={disabled || atMax}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Pick */}
      {q.type === "PLAYER_PICK" && (
        <select
          value={answer || ""}
          onChange={(e) => onSingleAnswer(e.target.value)}
          disabled={disabled}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200
            ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          <option value="">Select a player...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
