'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiPatch, apiPost } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorTransaction {
  id: string;
  type: string;
  month: string;
  is_paid: boolean;
  amount: number | null;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
}

interface VendorFeedback {
  id: string;
  type: string;
  month: string;
  title: string;
  description: string;
  severity: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface FeedbackData {
  items: VendorFeedback[];
  counts: { complaint: number; positive: number; suggestion: number };
  limits: { complaint: number; positive: number; suggestion: number };
  remaining: { complaint: number; positive: number; suggestion: number };
  month: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'transactions', label: 'Transactions', icon: '💳' },
  { key: 'complaints', label: 'Complaints', icon: '⚠️' },
  { key: 'positives', label: 'Positives', icon: '✅' },
  { key: 'suggestions', label: 'Suggestions', icon: '💡' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; order: number }> = {
  critical: { label: 'Critical', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', order: 1 },
  high:     { label: 'High',     color: '#F97316', bg: 'rgba(249,115,22,0.12)', order: 2 },
  medium:   { label: 'Medium',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', order: 3 },
  low:      { label: 'Low',      color: '#6EE7B7', bg: 'rgba(110,231,183,0.12)', order: 4 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:      { label: 'Pending',     color: '#888888' },
  acknowledged: { label: 'Seen',        color: '#3B82F6' },
  in_progress:  { label: 'In Progress', color: '#8B5CF6' },
  resolved:     { label: 'Resolved',    color: '#10B981' },
  dismissed:    { label: 'Dismissed',   color: '#4B5563' },
};

const TX_LABELS: Record<string, { label: string; icon: string }> = {
  rent:        { label: 'Rent',        icon: '🏪' },
  electricity: { label: 'Electricity', icon: '⚡' },
  water:       { label: 'Water',       icon: '💧' },
  other:       { label: 'Other',       icon: '📦' },
};

function monthLabel(m: string) {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TransactionCard({
  tx,
  onToggle,
}: {
  tx: VendorTransaction;
  onToggle: (id: string, is_paid: boolean) => void;
}) {
  const cfg = TX_LABELS[tx.type] ?? { label: tx.type, icon: '📄' };
  return (
    <GlassCard className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{cfg.icon}</span>
        <div>
          <p className="font-semibold text-brand-white">{cfg.label}</p>
          {tx.amount && (
            <p className="text-xs font-mono text-brand-dim">${tx.amount.toFixed(2)}</p>
          )}
          {tx.notes && <p className="text-xs text-brand-dim mt-0.5">{tx.notes}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {tx.paid_at && (
          <p className="text-xs text-brand-dim font-mono hidden sm:block">
            Paid {new Date(tx.paid_at).toLocaleDateString()}
          </p>
        )}
        <button
          onClick={() => onToggle(tx.id, !tx.is_paid)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            tx.is_paid
              ? 'bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25'
              : 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20'
          }`}
        >
          {tx.is_paid ? '✓ Paid' : '✗ Unpaid'}
        </button>
      </div>
    </GlassCard>
  );
}

function FeedbackCard({ item }: { item: VendorFeedback }) {
  const sev = item.severity ? SEVERITY_CONFIG[item.severity] : null;
  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;

  return (
    <GlassCard className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {sev && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{ color: sev.color, backgroundColor: sev.bg }}
            >
              {sev.label}
            </span>
          )}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}18` }}
          >
            {statusCfg.label}
          </span>
        </div>
        <p className="text-xs text-brand-dim font-mono flex-shrink-0">
          {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>

      <p className="font-semibold text-brand-white">{item.title}</p>
      <p className="text-sm text-brand-chrome leading-relaxed">{item.description}</p>

      {item.admin_note && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-300">
            <span className="font-semibold">Admin note:</span> {item.admin_note}
          </p>
          {item.reviewed_by && (
            <p className="text-xs text-brand-dim mt-0.5">— {item.reviewed_by}</p>
          )}
        </div>
      )}
    </GlassCard>
  );
}

function CreateFeedbackModal({
  type,
  remaining,
  onClose,
  onSubmit,
}: {
  type: 'complaint' | 'positive' | 'suggestion';
  remaining: number;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; severity?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    await onSubmit({ title, description, ...(type === 'complaint' ? { severity } : {}) });
    setSubmitting(false);
  }

  const typeLabels = {
    complaint: { title: 'New Complaint', placeholder: 'Describe the issue...' },
    positive: { title: 'Share a Positive', placeholder: 'What went well?' },
    suggestion: { title: 'Add a Suggestion', placeholder: 'Your idea for improvement...' },
  };
  const cfg = typeLabels[type];

  return (
    <Modal isOpen onClose={onClose} title={cfg.title} size="md">
      <div className="p-5 space-y-4">
        <p className="text-xs text-brand-dim">
          {remaining} submission{remaining !== 1 ? 's' : ''} remaining this month
        </p>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Short summary..."
            className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
          />
        </div>

        {type === 'complaint' && (
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Severity</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(SEVERITY_CONFIG).sort(([,a],[,b]) => a.order - b.order).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setSeverity(key)}
                  className="py-2 rounded-xl text-xs font-bold border transition-all"
                  style={{
                    color: severity === key ? '#fff' : cfg.color,
                    backgroundColor: severity === key ? cfg.color : cfg.bg,
                    borderColor: severity === key ? cfg.color : `${cfg.color}40`,
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={cfg.placeholder}
            className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 resize-none"
          />
          <p className="text-xs text-brand-dim text-right mt-1">{description.length}/1000</p>
        </div>

        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!title.trim() || !description.trim()}
          size="lg"
          className="w-full font-heading tracking-widest"
        >
          SUBMIT
        </Button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [tab, setTab] = useState<TabKey>('transactions');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingFb, setLoadingFb] = useState(true);
  const [createType, setCreateType] = useState<'complaint' | 'positive' | 'suggestion' | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const data = await apiFetch<VendorTransaction[]>(`/vendor/operations/transactions?month=${month}`);
      setTransactions(data);
    } catch { addToast({ message: 'Failed to load transactions', type: 'error' }); }
    setLoadingTx(false);
  }, [month, addToast]);

  const loadFeedback = useCallback(async () => {
    setLoadingFb(true);
    try {
      const data = await apiFetch<FeedbackData>(`/vendor/operations/feedback?month=${month}`);
      setFeedbackData(data);
    } catch { addToast({ message: 'Failed to load feedback', type: 'error' }); }
    setLoadingFb(false);
  }, [month, addToast]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);
  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  async function toggleTransaction(id: string, is_paid: boolean) {
    try {
      await apiPatch(`/vendor/operations/transactions/${id}`, { is_paid });
      addToast({ message: is_paid ? 'Marked as paid' : 'Marked as unpaid', type: 'success' });
      loadTransactions();
    } catch { addToast({ message: 'Update failed', type: 'error' }); }
  }

  async function submitFeedback(data: { title: string; description: string; severity?: string }) {
    if (!createType) return;
    try {
      await apiPost('/vendor/operations/feedback', { type: createType, ...data });
      addToast({ message: 'Submitted', type: 'success' });
      setCreateType(null);
      loadFeedback();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to submit';
      addToast({ message: msg, type: 'error' });
      throw e;
    }
  }

  // Month navigator
  const prevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m);
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (next <= nowStr) setMonth(next);
  };
  const isCurrentMonth = month === (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })();

  const feedbackByType = {
    complaint: feedbackData?.items.filter((i) => i.type === 'complaint').sort((a, b) => {
      const o = SEVERITY_CONFIG;
      return (o[a.severity ?? 'low']?.order ?? 5) - (o[b.severity ?? 'low']?.order ?? 5);
    }) ?? [],
    positive: feedbackData?.items.filter((i) => i.type === 'positive') ?? [],
    suggestion: feedbackData?.items.filter((i) => i.type === 'suggestion') ?? [],
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">OPERATIONS</h1>

        {/* Month picker */}
        <div className="flex items-center gap-2 bg-brand-card border border-black/8 rounded-xl px-3 py-2">
          <button onClick={prevMonth} className="text-brand-dim hover:text-brand-white transition-colors px-1">‹</button>
          <span className="font-mono text-sm text-brand-chrome min-w-[130px] text-center">{monthLabel(month)}</span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="text-brand-dim hover:text-brand-white transition-colors px-1 disabled:opacity-30"
          >›</button>
        </div>
      </div>

      {/* Monthly obligation summary (always visible) */}
      {feedbackData && (
        <div className="grid grid-cols-3 gap-3">
          {(['complaint', 'positive', 'suggestion'] as const).map((type) => {
            const count = feedbackData.counts[type];
            const limit = feedbackData.limits[type];
            const pct = Math.min(100, (count / limit) * 100);
            const colors = { complaint: '#EF4444', positive: '#10B981', suggestion: '#F59E0B' };
            const icons = { complaint: '⚠️', positive: '✅', suggestion: '💡' };
            const labels = { complaint: 'Complaints', positive: 'Positives', suggestion: 'Suggestions' };
            const isRequired = type !== 'complaint';
            const complete = count >= limit;

            return (
              <GlassCard key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg">{icons[type]}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: colors[type], backgroundColor: `${colors[type]}18` }}
                  >
                    {count}/{limit}
                  </span>
                </div>
                <p className="text-xs font-semibold text-brand-chrome">{labels[type]}</p>
                <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: colors[type] }}
                  />
                </div>
                {isRequired && (
                  <p className="text-xs text-brand-dim">
                    {complete ? '✓ Done' : `${limit - count} more required`}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-card border border-black/8 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key
                ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/25'
                : 'text-brand-dim hover:text-brand-white'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* TRANSACTIONS */}
          {tab === 'transactions' && (
            <div className="space-y-3">
              {loadingTx ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : transactions.length === 0 ? (
                <p className="text-center py-12 text-brand-dim">No transactions for this month.</p>
              ) : (
                transactions.map((tx) => (
                  <TransactionCard key={tx.id} tx={tx} onToggle={toggleTransaction} />
                ))
              )}
            </div>
          )}

          {/* COMPLAINTS */}
          {tab === 'complaints' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-brand-dim">
                  {feedbackData ? `${feedbackData.remaining.complaint} of ${feedbackData.limits.complaint} remaining` : ''}
                </p>
                {isCurrentMonth && feedbackData && feedbackData.remaining.complaint > 0 && (
                  <Button size="sm" onClick={() => setCreateType('complaint')}>+ New Complaint</Button>
                )}
              </div>

              {loadingFb ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : feedbackByType.complaint.length === 0 ? (
                <GlassCard className="text-center py-10">
                  <p className="text-brand-dim text-sm">No complaints this month.</p>
                  {isCurrentMonth && <p className="text-xs text-brand-dim mt-1">Use complaints to flag operational issues.</p>}
                </GlassCard>
              ) : (
                feedbackByType.complaint.map((item) => <FeedbackCard key={item.id} item={item} />)
              )}
            </div>
          )}

          {/* POSITIVES */}
          {tab === 'positives' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-brand-dim">
                  {feedbackData
                    ? feedbackData.counts.positive >= feedbackData.limits.positive
                      ? '✓ Monthly requirement met'
                      : `${feedbackData.remaining.positive} more required this month`
                    : ''}
                </p>
                {isCurrentMonth && feedbackData && feedbackData.remaining.positive > 0 && (
                  <Button size="sm" onClick={() => setCreateType('positive')}>+ Add Positive</Button>
                )}
              </div>

              {loadingFb ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : feedbackByType.positive.length === 0 ? (
                <GlassCard className="text-center py-10">
                  <p className="text-brand-dim text-sm">No positives submitted yet.</p>
                  {isCurrentMonth && (
                    <p className="text-xs text-brand-dim mt-1">Share what&apos;s working well — 5 required per month.</p>
                  )}
                </GlassCard>
              ) : (
                feedbackByType.positive.map((item) => <FeedbackCard key={item.id} item={item} />)
              )}
            </div>
          )}

          {/* SUGGESTIONS */}
          {tab === 'suggestions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-brand-dim">
                  {feedbackData
                    ? feedbackData.counts.suggestion >= feedbackData.limits.suggestion
                      ? '✓ Monthly requirement met'
                      : `${feedbackData.remaining.suggestion} more required this month`
                    : ''}
                </p>
                {isCurrentMonth && feedbackData && feedbackData.remaining.suggestion > 0 && (
                  <Button size="sm" onClick={() => setCreateType('suggestion')}>+ Add Suggestion</Button>
                )}
              </div>

              {loadingFb ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : feedbackByType.suggestion.length === 0 ? (
                <GlassCard className="text-center py-10">
                  <p className="text-brand-dim text-sm">No suggestions yet.</p>
                  {isCurrentMonth && (
                    <p className="text-xs text-brand-dim mt-1">Share ideas to improve the food village — 5 required per month.</p>
                  )}
                </GlassCard>
              ) : (
                feedbackByType.suggestion.map((item) => <FeedbackCard key={item.id} item={item} />)
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create feedback modal */}
      {createType && feedbackData && (
        <CreateFeedbackModal
          type={createType}
          remaining={feedbackData.remaining[createType]}
          onClose={() => setCreateType(null)}
          onSubmit={submitFeedback}
        />
      )}
    </div>
  );
}
