import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { getAdminEmail } from "../../config";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import PointsInput from "../../components/admin/PointsInput";
import { useAdmin } from "../../hooks/useAdmin";
import { apiGetLongTermConfig } from "../../api";

export default function LongTermConfig() {
  const { user } = useAuth();
  const toast = useToast();
  const adminEmail = getAdminEmail();
  const isAdmin = user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;
  const admin = useAdmin();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    eventId: "t20wc_2026",
    winnerPoints: 5000,
    finalistPoints: 2000,
    finalFourPoints: 1000,
    orangeCapPoints: 3000,
    purpleCapPoints: 3000,
    lockTime: "",
    isLocked: false,
    changeCostPercent: 10,
    allowChanges: false,
  });

  useEffect(() => {
    apiGetLongTermConfig("t20wc_2026")
      .then((cfg) => {
        if (cfg) {
          setForm({
            eventId: cfg.eventId,
            winnerPoints: cfg.winnerPoints,
            finalistPoints: cfg.finalistPoints,
            finalFourPoints: cfg.finalFourPoints,
            orangeCapPoints: cfg.orangeCapPoints,
            purpleCapPoints: cfg.purpleCapPoints,
            lockTime: cfg.lockTime ? cfg.lockTime.replace("Z", "").split(".")[0] : "",
            isLocked: cfg.isLocked,
            changeCostPercent: cfg.changeCostPercent,
            allowChanges: cfg.allowChanges,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      await admin.saveLongTermConfig(form);
      toast.success("Long-term config saved!");
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="card text-center py-12"><p className="text-red-400">Access Denied</p></div></div>;

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <AdminNav />
      <h1 className="text-2xl font-bold text-gray-200 mb-6">Long-Term Bets Configuration</h1>

      <div className="card space-y-6">
        <h2 className="text-lg font-semibold text-gray-200">Point Values</h2>
        <p className="text-sm text-gray-500">These are the points users earn for correct long-term predictions.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PointsInput label="Tournament Winner Points" value={form.winnerPoints} onChange={(v) => setForm({ ...form, winnerPoints: v })} description="Points for correctly predicting the winner" />
          <PointsInput label="Finalist Points (per correct)" value={form.finalistPoints} onChange={(v) => setForm({ ...form, finalistPoints: v })} description="Points per correctly predicted finalist" />
          <PointsInput label="Final Four Points (per correct)" value={form.finalFourPoints} onChange={(v) => setForm({ ...form, finalFourPoints: v })} description="Points per correctly predicted semi-finalist" />
          <PointsInput label="Orange Cap Points" value={form.orangeCapPoints} onChange={(v) => setForm({ ...form, orangeCapPoints: v })} description="Points for correct highest run-scorer" />
          <PointsInput label="Purple Cap Points" value={form.purpleCapPoints} onChange={(v) => setForm({ ...form, purpleCapPoints: v })} description="Points for correct highest wicket-taker" />
        </div>

        <h2 className="text-lg font-semibold text-gray-200 pt-4 border-t border-gray-700">Lock Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">Lock Time</label>
            <input
              type="datetime-local"
              value={form.lockTime}
              onChange={(e) => setForm({ ...form, lockTime: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
            />
            <p className="text-xs text-gray-500 mt-1">When predictions lock (usually first match start)</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isLocked}
                onChange={(e) => setForm({ ...form, isLocked: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-brand-600"
              />
              <span className="text-sm text-gray-300">Locked (manual override)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allowChanges}
                onChange={(e) => setForm({ ...form, allowChanges: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-brand-600"
              />
              <span className="text-sm text-gray-300">Allow paid changes after lock</span>
            </label>
          </div>

          {form.allowChanges && (
            <PointsInput
              label="Change Cost (%)"
              value={form.changeCostPercent}
              onChange={(v) => setForm({ ...form, changeCostPercent: v })}
              step={1}
              min={0}
              max={100}
              description="Percentage of total points deducted per edit"
            />
          )}
        </div>

        <button onClick={handleSave} disabled={admin.saving} className="btn-primary">
          {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
          Save Configuration
        </button>
      </div>
    </div>
  );
}
