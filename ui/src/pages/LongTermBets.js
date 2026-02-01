import React, { useState, useEffect } from "react";
import { apiGetEvents, apiGetLongTermBets, apiSubmitLongTermBets, apiGetUserLongTermBets } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

export default function LongTermBets() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGetEvents().then((events) => {
      const active = events?.find((e) => e.status === "ACTIVE") || events?.[0];
      if (!active) { setLoading(false); return; }
      return Promise.all([
        apiGetLongTermBets(active.eventId),
        user ? apiGetUserLongTermBets(identity.userId) : Promise.resolve(null),
      ])
      .then(([q, bets]) => {
        setQuestions(q);
        if (bets) {
          setExisting(bets);
          setAnswers(bets.answers || {});
        }
      });
    }).catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isLocked = existing?.isLocked;

  async function handleSubmit() {
    if (!user) return toast.error("Sign in to submit");
    const unanswered = questions.filter((q) => !answers[q.questionId]);
    if (unanswered.length > 0) return toast.error(`Answer all ${unanswered.length} remaining questions`);
    setSubmitting(true);
    try {
      const result = await apiSubmitLongTermBets(identity.userId, answers);
      setExisting(result);
      toast.success("Long-term predictions locked!");
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
        <p className="text-gray-500">Make your season-long predictions. Once submitted, they are locked for the entire tournament.</p>
      </div>

      {!user && (
        <div className="card mb-6 text-center py-6 bg-brand-950/40 border-brand-800/40">
          <p className="text-brand-300">Sign in to submit your tournament predictions</p>
        </div>
      )}

      {isLocked && (
        <div className="card mb-6 text-center bg-emerald-950/20 border-emerald-800/30">
          <p className="text-emerald-400 font-semibold">Your tournament predictions are locked!</p>
          <p className="text-gray-500 text-sm mt-1">Submitted at {new Date(existing.submittedAt).toLocaleString()}</p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => {
          const qDisabled = isLocked || !user;
          return (
            <div key={q.questionId} className="card animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-100 text-sm">
                  <span className="text-purple-400 mr-2">Q{i + 1}.</span>
                  {q.text}
                </h3>
              </div>

              {q.optionType === "YES_NO" || q.optionType === "MULTIPLE_CHOICE" || q.optionType === "TEAM_PICK" ? (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.optionId}
                      className={`px-4 py-2 rounded-lg text-sm cursor-pointer border transition-all ${
                        answers[q.questionId] === opt.optionId
                          ? "bg-purple-600/30 border-purple-600 text-purple-200"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      } ${qDisabled ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <input
                        type="radio" name={q.questionId} value={opt.optionId}
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
                  {q.options.map((opt) => <option key={opt.optionId} value={opt.optionId}>{opt.label}</option>)}
                </select>
              )}
            </div>
          );
        })}
      </div>

      {user && !isLocked && (
        <div className="mt-8 text-center">
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-lg px-10 py-4">
            {submitting && <Spinner size="sm" className="text-white inline mr-2" />}
            Lock Predictions
          </button>
          <p className="text-gray-600 text-xs mt-2">Once locked, you cannot change your answers.</p>
        </div>
      )}
    </div>
  );
}
