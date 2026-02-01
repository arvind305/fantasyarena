import React, { useState } from "react";

const FAQS = [
  { q: "How do I make predictions?", a: "Navigate to an upcoming match from the home page, answer all prediction questions, and click Submit. Your predictions lock when the match starts." },
  { q: "Can I change my predictions?", a: "You can update match predictions any time before the match starts. Long-term tournament predictions are locked permanently once submitted." },
  { q: "How are points calculated?", a: "Each question has a point value shown next to it. You earn the full points for a correct prediction, zero for incorrect." },
  { q: "What are long-term bets?", a: "These are tournament-wide predictions (e.g., 'Who will win the tournament?') that you submit once before the deadline." },
  { q: "How do groups work?", a: "Create a group and share the code with friends. Each group has its own leaderboard so you can compete privately." },
  { q: "Is this real-money betting?", a: "No. This is a free prediction platform for entertainment and friendly competition only. No real money is involved." },
  { q: "Do I need to sign in?", a: "You can browse all content without signing in, but you need to be signed in to submit predictions and join groups." },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1 text-gray-100">FAQ</h1>
        <p className="text-gray-500">Frequently asked questions about the platform.</p>
      </div>
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="card cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 40}ms` }} onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-200 text-sm">{f.q}</h3>
              <span className="text-gray-500 text-lg ml-3">{open === i ? "\u2212" : "+"}</span>
            </div>
            {open === i && <p className="text-gray-400 text-sm mt-3">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
