import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetMatch, apiGetBettingQuestions, apiSubmitBets, apiGetUserBets } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Countdown({ target }) {
  const [diff, setDiff] = useState(new Date(target) - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(target) - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diff <= 0) return <span className="text-red-400 font-semibold">Started</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return <span className="font-mono text-brand-300">{h}h {m}m {s}s</span>;
}

export default function MatchBetting() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();

  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGetMatch(matchId),
      apiGetBettingQuestions(matchId),
      user ? apiGetUserBets(matchId, identity.userId) : Promise.resolve(null),
    ])
      .then(([m, q, bets]) => {
        setMatch(m);
        setQuestions(q);
        if (bets) {
          setExisting(bets);
          setAnswers(bets.answers || {});
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [matchId]);

  // Lock and editability are derived from SERVER-PROVIDED status.
  // The UI does NOT compute lock timing — it reads question.status and bet.isLocked.
  // Invariant: questions with status !== "OPEN" are read-only.
  const allQuestionsOpen = questions.length > 0 && questions.every((q) => q.status === "OPEN");
  const isLocked = !allQuestionsOpen || existing?.isLocked;
  const isEditable = allQuestionsOpen && !existing?.isLocked;

  async function handleSubmit() {
    if (!user) return toast.error("Sign in to submit your predictions");
    const unanswered = questions.filter((q) => !answers[q.questionId]);
    if (unanswered.length > 0) return toast.error(`Please answer all ${unanswered.length} remaining questions`);
    setSubmitting(true);
    try {
      const result = await apiSubmitBets(matchId, identity.userId, answers);
      setExisting(result);
      toast.success("Predictions submitted!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">Match not found</p>
          <Link to="/" className="text-brand-400 text-sm mt-2 inline-block">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Match Header */}
      <div className="card mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: match.teamA?.color + "30", color: match.teamA?.color }}>
                {match.teamA?.shortName}
              </div>
            </div>
            <span className="text-gray-500 text-sm font-semibold">vs</span>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: match.teamB?.color + "30", color: match.teamB?.color }}>
                {match.teamB?.shortName}
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-400">{formatDate(match.scheduledTime)}</div>
            <div className="text-gray-500 text-xs">{match.venue}</div>
            {match.status === "UPCOMING" && (
              <div className="mt-1">
                <span className="text-gray-500 text-xs">Starts in </span>
                <Countdown target={match.scheduledTime} />
              </div>
            )}
          </div>
        </div>

        {/* Status badges — read from server-provided match.status */}
        <div className="flex items-center gap-3">
          {match.status === "LIVE" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-emerald-900/50 text-emerald-400 border-emerald-800">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 align-middle" />
              LIVE
            </span>
          )}
          {match.status === "COMPLETED" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-gray-800/80 text-gray-400 border-gray-700">Completed</span>
          )}
          {match.status === "UPCOMING" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-blue-900/50 text-blue-400 border-blue-800">Upcoming</span>
          )}
          {match.status === "ABANDONED" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-red-900/50 text-red-400 border-red-800">Abandoned</span>
          )}
          {existing && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-brand-900/50 text-brand-300 border-brand-800">
              Submitted {new Date(existing.submittedAt).toLocaleTimeString()}
            </span>
          )}
          {match.result && <span className="text-sm text-gray-400 ml-auto">{match.result}</span>}
        </div>
      </div>

      {/* Guest CTA */}
      {!user && (
        <div className="card mb-6 text-center py-6 bg-brand-950/40 border-brand-800/40">
          <p className="text-brand-300 mb-2">Sign in to submit your predictions</p>
          <p className="text-gray-500 text-sm">You can browse the questions below, but need to be logged in to play.</p>
        </div>
      )}

      {/* Questions — rendered from server-provided data, no client-side filtering */}
      <h2 className="text-xl font-bold mb-4 text-gray-200">Predictions</h2>
      <div className="space-y-4">
        {questions.map((q, i) => {
          const qDisabled = q.status !== "OPEN" || !user;
          return (
            <div key={q.questionId} className="card animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-100 text-sm">
                  <span className="text-brand-400 mr-2">Q{i + 1}.</span>
                  {q.text}
                </h3>
                {q.status === "LOCKED" && (
                  <span className="text-xs text-amber-500 whitespace-nowrap ml-3">Locked</span>
                )}
              </div>

              {q.optionType === "YES_NO" || q.optionType === "MULTIPLE_CHOICE" || q.optionType === "TEAM_PICK" ? (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.optionId}
                      className={`px-4 py-2 rounded-lg text-sm cursor-pointer border transition-all ${
                        answers[q.questionId] === opt.optionId
                          ? "bg-brand-600/30 border-brand-600 text-brand-200"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      } ${qDisabled ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <input
                        type="radio"
                        name={q.questionId}
                        value={opt.optionId}
                        checked={answers[q.questionId] === opt.optionId}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.questionId]: opt.optionId }))}
                        disabled={qDisabled}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              ) : (
                <select
                  value={answers[q.questionId] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                  disabled={qDisabled}
                  className="input text-sm"
                >
                  <option value="">Select...</option>
                  {q.options.map((opt) => (
                    <option key={opt.optionId} value={opt.optionId}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      {user && isEditable && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-lg px-10 py-4"
          >
            {submitting ? <Spinner size="sm" className="text-white inline mr-2" /> : null}
            {existing ? "Update Predictions" : "Submit Predictions"}
          </button>
        </div>
      )}

      {isLocked && existing && (
        <div className="mt-8 card text-center bg-emerald-950/20 border-emerald-800/30">
          <p className="text-emerald-400 font-semibold">Your predictions are locked!</p>
          <p className="text-gray-500 text-sm mt-1">Results will be revealed after the match.</p>
        </div>
      )}
    </div>
  );
}
