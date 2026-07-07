'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch, apiPatch } from '@/lib/api';
import type { AuditLog } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

// ─── System audit ────────────────────────────────────────────────────────────

const ACTION_COLOR: Record<string, string> = {
  'order.cancel': '#EF4444',
  'vendor.delete': '#EF4444',
  'vendor.suspend': '#F59E0B',
  'promotion.delete': '#EF4444',
  'staff.remove': '#EF4444',
  'vendor.create': '#10B981',
  'promotion.create': '#10B981',
  'vendor.update': '#3B82F6',
  'order.status_update': '#3B82F6',
  'promotion.update': '#3B82F6',
  'cash.log': '#8B5CF6',
};

interface AuditResult { logs: AuditLog[]; total: number; page: number; pages: number; }

// ─── Vendor feedback ─────────────────────────────────────────────────────────

interface VendorFeedback {
  id: string;
  vendor_id: string;
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
  vendor: { id: string; name: string; booth_number: number };
}

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

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  complaint:  { label: 'Complaint',  icon: '⚠️', color: '#EF4444' },
  positive:   { label: 'Positive',   icon: '✅', color: '#10B981' },
  suggestion: { label: 'Suggestion', icon: '💡', color: '#F59E0B' },
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function ReviewModal({
  item,
  onClose,
  onSave,
}: {
  item: VendorFeedback;
  onClose: () => void;
  onSave: (id: string, status: string, note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.admin_note ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(item.id, status, note);
    setSaving(false);
  }

  const typeCfg = TYPE_CONFIG[item.type] ?? { label: item.type, icon: '📝', color: '#888' };
  const sevCfg = item.severity ? SEVERITY_CONFIG[item.severity] : null;

  return (
    <Modal isOpen onClose={onClose} title="Review Feedback" size="md">
      <div className="p-5 space-y-4">
        {/* Context */}
        <div className="bg-brand-bg rounded-xl p-4 space-y-2 border border-black/6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{typeCfg.icon}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: typeCfg.color, backgroundColor: `${typeCfg.color}18` }}>
              {typeCfg.label}
            </span>
            {sevCfg && (
              <span className="text-xs font-bold px-2 py-0.5 rounded uppercase" style={{ color: sevCfg.color, backgroundColor: sevCfg.bg }}>
                {sevCfg.label}
              </span>
            )}
            <span className="text-xs text-brand-dim font-mono ml-auto">
              Booth {item.vendor.booth_number} · {item.vendor.name}
            </span>
          </div>
          <p className="font-semibold text-brand-white">{item.title}</p>
          <p className="text-sm text-brand-chrome leading-relaxed">{item.description}</p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-2 uppercase tracking-wider">Update Status</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className="py-2 px-3 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  color: status === key ? '#fff' : cfg.color,
                  backgroundColor: status === key ? cfg.color : `${cfg.color}15`,
                  borderColor: status === key ? cfg.color : `${cfg.color}30`,
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Admin Note (visible to vendor)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional note for the vendor..."
            className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 resize-none"
          />
        </div>

        <Button onClick={save} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          SAVE REVIEW
        </Button>
      </div>
    </Modal>
  );
}

// ─── Vendor Feedback Panel ────────────────────────────────────────────────────

function VendorFeedbackPanel() {
  const [feedback, setFeedback] = useState<VendorFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [reviewing, setReviewing] = useState<VendorFeedback | null>(null);

  const isCurrentMonth = month === currentMonth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (severityFilter) params.set('severity', severityFilter);
      const data = await apiFetch<VendorFeedback[]>(`/vendor/operations/admin/feedback?${params}`);
      setFeedback(data);
    } catch {}
    setLoading(false);
  }, [month, typeFilter, statusFilter, severityFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleReview(id: string, status: string, admin_note: string) {
    await apiPatch(`/vendor/operations/admin/feedback/${id}`, { status, admin_note });
    setReviewing(null);
    load();
  }

  const prevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (next <= currentMonth()) setMonth(next);
  };

  // Sort by severity for complaints, then date
  const sorted = [...feedback].sort((a, b) => {
    if (a.type === 'complaint' && b.type === 'complaint') {
      const ao = SEVERITY_CONFIG[a.severity ?? 'low']?.order ?? 5;
      const bo = SEVERITY_CONFIG[b.severity ?? 'low']?.order ?? 5;
      if (ao !== bo) return ao - bo;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pendingCount = feedback.filter((f) => f.status === 'pending').length;
  const criticalCount = feedback.filter((f) => f.severity === 'critical').length;

  return (
    <div className="space-y-5">
      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-400">{pendingCount} pending review</span>
          </div>
        )}
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 rounded-xl">
            <span className="text-xs font-semibold text-red-400">🚨 {criticalCount} critical</span>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Month picker */}
        <div className="flex items-center gap-1 bg-brand-card border border-black/8 rounded-xl px-2 py-1.5">
          <button onClick={prevMonth} className="text-brand-dim hover:text-brand-white px-1">‹</button>
          <span className="font-mono text-xs text-brand-chrome min-w-[110px] text-center">{monthLabel(month)}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="text-brand-dim hover:text-brand-white px-1 disabled:opacity-30">›</button>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-xs text-brand-white focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="complaint">Complaints</option>
          <option value="positive">Positives</option>
          <option value="suggestion">Suggestions</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-xs text-brand-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-xs text-brand-white focus:outline-none"
        >
          <option value="">All Severities</option>
          {Object.entries(SEVERITY_CONFIG).sort(([,a],[,b]) => a.order - b.order).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : sorted.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-brand-dim">No feedback entries for this selection.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => {
            const typeCfg = TYPE_CONFIG[item.type] ?? { label: item.type, icon: '📝', color: '#888' };
            const sevCfg = item.severity ? SEVERITY_CONFIG[item.severity] : null;
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;

            return (
              <GlassCard key={item.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{typeCfg.icon}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: typeCfg.color, backgroundColor: `${typeCfg.color}18` }}>
                      {typeCfg.label}
                    </span>
                    {sevCfg && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ color: sevCfg.color, backgroundColor: sevCfg.bg }}>
                        {sevCfg.label}
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded font-semibold"
                      style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}18` }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-brand-orange">Booth {item.vendor.booth_number} · {item.vendor.name}</p>
                    <p className="text-xs text-brand-dim font-mono">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-brand-white mb-1">{item.title}</p>
                  <p className="text-sm text-brand-chrome leading-relaxed">{item.description}</p>
                </div>

                {item.admin_note && (
                  <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-300">
                      <span className="font-semibold">Note:</span> {item.admin_note}
                    </p>
                    {item.reviewed_by && (
                      <p className="text-xs text-brand-dim mt-0.5">— {item.reviewed_by} · {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : ''}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => setReviewing(item)}>
                    Review
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {reviewing && (
        <ReviewModal
          item={reviewing}
          onClose={() => setReviewing(null)}
          onSave={handleReview}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageTab = 'system' | 'feedback';

export default function AdminAuditPage() {
  const [pageTab, setPageTab] = useState<PageTab>('system');

  // System audit state
  const [data, setData] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30', from, to });
      if (actionFilter) params.set('action', actionFilter);
      const res = await apiFetch<AuditResult>(`/admin/audit?${params}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [page, from, to, actionFilter]);

  useEffect(() => { if (pageTab === 'system') load(); }, [load, pageTab]);

  const COMMON_ACTIONS = ['order.cancel', 'vendor.create', 'vendor.suspend', 'vendor.update', 'promotion.create', 'promotion.delete', 'staff.remove', 'cash.log'];

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">AUDIT</h1>

        {/* Page tab switcher */}
        <div className="flex gap-1 bg-brand-card border border-black/8 rounded-xl p-1">
          {([
            { key: 'system', label: '🔍 System Log' },
            { key: 'feedback', label: '📋 Vendor Feedback' },
          ] as { key: PageTab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setPageTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                pageTab === t.key
                  ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/25'
                  : 'text-brand-dim hover:text-brand-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {pageTab === 'feedback' ? (
        <VendorFeedbackPanel />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-3 items-center flex-wrap mb-5">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
            <span className="text-brand-dim">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            >
              <option value="">All Actions</option>
              {COMMON_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <>
              <GlassCard className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-black/6">
                    <tr className="text-brand-dim text-xs uppercase tracking-wider">
                      {['Time', 'Actor', 'Role', 'Action', 'Entity', 'Details'].map((h) => (
                        <th key={h} className="text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {(data?.logs ?? []).map((log) => (
                      <>
                        <tr
                          key={log.id}
                          className="hover:bg-black/2 transition-colors cursor-pointer"
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        >
                          <td className="px-4 py-3 text-brand-dim text-xs font-mono whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-brand-chrome text-sm">{log.actor_name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-brand-steel text-brand-dim capitalize">{log.actor_role.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold" style={{ color: ACTION_COLOR[log.action] ?? '#888888' }}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-brand-dim text-xs font-mono">{log.entity_type}{log.entity_id ? `/${log.entity_id.slice(0, 8)}` : ''}</td>
                          <td className="px-4 py-3 text-brand-dim text-xs">{expanded === log.id ? '▲' : '▼'}</td>
                        </tr>
                        {expanded === log.id && (
                          <tr key={`${log.id}-exp`} className="bg-brand-bg/40">
                            <td colSpan={6} className="px-6 py-3">
                              <pre className="text-xs text-brand-dim font-mono bg-brand-bg rounded-lg p-3 overflow-auto max-h-32">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {(data?.logs ?? []).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-dim">No audit log entries for this range</td></tr>
                    )}
                  </tbody>
                </table>
              </GlassCard>

              {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <p className="text-brand-dim font-mono">{data.total} entries</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <span className="px-3 py-1.5 text-brand-dim">{page} / {data.pages}</span>
                    <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pages}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
