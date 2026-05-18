import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Download, Send, Trash2, Receipt, CheckCircle,
  PanelRight, X, ExternalLink, Loader2, Mail, Phone, Building2,
  Calendar, DollarSign, Edit, FileText, Copy,
} from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { Invoice } from '../../types';
import { formatCurrency, formatDate, getStatusColor, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import Modal from '../../components/common/Modal';

// ── Invoice Quick Panel ───────────────────────────────────────────────────────

function InvoiceQuickPanel({ id, onClose, onMarkPaid, onSend }: {
  id: string;
  onClose: () => void;
  onMarkPaid: (inv: Invoice) => void;
  onSend: (id: string) => void;
}) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => { const res = await invoiceService.getInvoiceById(id); return res.data.data; },
    enabled: !!id,
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[40vw] max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700"
      style={{ animation: 'slideInPanel 0.22s ease-out' }}>
      <style>{`@keyframes slideInPanel { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Details</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { invoiceService.downloadPDF(id, data?.invoiceNumber || id); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Download PDF">
            <Download size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><X size={15} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : !data ? (
          <p className="text-center py-16 text-slate-400">Not found</p>
        ) : (
          <>
            {/* Hero */}
            <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">{data.invoiceNumber}</h2>
                    <button
                      onClick={() => { navigator.clipboard.writeText(data.invoiceNumber); toast.success('Copied!'); }}
                      className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  {data.client && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      <Building2 size={12} />{data.client.companyName}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={cn('badge text-xs', getStatusColor(data.status))}>{data.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700/60 border-b border-slate-100 dark:border-slate-700/60">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Total</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(data.totalAmount)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Paid</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.paidAmount ?? 0)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Balance</p>
                <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                  {formatCurrency(data.totalAmount - (data.paidAmount ?? 0))}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                Issued: {formatDate(data.invoiceDate)}
              </div>
              {data.dueDate && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                  Due: {formatDate(data.dueDate)}
                </div>
              )}
              {data.paidAt && (
                <div className="flex items-center gap-2.5 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle size={13} className="flex-shrink-0" />
                  Paid: {formatDate(data.paidAt)}{data.paymentMethod ? ` via ${data.paymentMethod}` : ''}
                </div>
              )}
            </div>

            {/* Client contact */}
            {data.client && (
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Client</p>
                {data.client.email && (
                  <a href={`mailto:${data.client.email}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 truncate">
                    <Mail size={13} className="text-slate-400 flex-shrink-0" />{data.client.email}
                  </a>
                )}
              </div>
            )}

            {/* Line items */}
            {data.lineItems?.length > 0 && (
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Line Items</p>
                <div className="space-y-2">
                  {data.lineItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-700 dark:text-slate-200 truncate">{item.description}</p>
                        <p className="text-xs text-slate-400">{item.quantity} × {formatCurrency(item.rate)}</p>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-white ml-3 flex-shrink-0">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1 text-xs">
                  {data.cgstAmount ? <div className="flex justify-between text-slate-500"><span>CGST</span><span>{formatCurrency(data.cgstAmount)}</span></div> : null}
                  {data.sgstAmount ? <div className="flex justify-between text-slate-500"><span>SGST</span><span>{formatCurrency(data.sgstAmount)}</span></div> : null}
                  {data.igstAmount ? <div className="flex justify-between text-slate-500"><span>IGST</span><span>{formatCurrency(data.igstAmount)}</span></div> : null}
                  <div className="flex justify-between font-semibold text-slate-800 dark:text-white text-sm pt-1">
                    <span>Total</span><span>{formatCurrency(data.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {data.notes && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{data.notes}</p>
              </div>
            )}
          </>
        )}
      </div>

      {data && (
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
          {data.status !== 'PAID' && data.status !== 'CANCELLED' && (
            <>
              <button onClick={() => onSend(id)} className="btn-secondary flex-1 justify-center text-xs py-1.5">
                <Send size={13} /> Send
              </button>
              <button onClick={() => onMarkPaid(data)} className="btn-secondary flex-1 justify-center text-xs py-1.5 text-green-600 border-green-200 hover:bg-green-50">
                <CheckCircle size={13} /> Mark Paid
              </button>
            </>
          )}
          <button onClick={() => navigate(`/invoices/${id}/edit`)} className="btn-primary flex-1 justify-center text-xs py-1.5">
            <Edit size={13} /> Edit
          </button>
        </div>
      )}
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────

interface ContextMenuState { x: number; y: number; invoice: Invoice }

function InvoiceContextMenu({ state, onClose, onView, onDownload, onSend, onMarkPaid, onDelete }: {
  state: ContextMenuState;
  onClose: () => void;
  onView: () => void;
  onDownload: () => void;
  onSend: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [onClose]);

  // Adjust position so menu doesn't go off screen
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(state.y, window.innerHeight - 260),
    left: Math.min(state.x, window.innerWidth - 200),
    zIndex: 200,
  };

  const inv = state.invoice;
  const canSendOrPay = inv.status !== 'PAID' && inv.status !== 'CANCELLED';

  const Item = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60',
      )}
    >
      <span className="text-slate-400">{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={ref} style={style} className="w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1">
      <Item icon={<PanelRight size={14} />} label="Quick View" onClick={onView} />
      <Item icon={<Download size={14} />} label="Download PDF" onClick={onDownload} />
      {canSendOrPay && <Item icon={<Send size={14} />} label="Send to Client" onClick={onSend} />}
      {canSendOrPay && <Item icon={<CheckCircle size={14} />} label="Mark as Paid" onClick={onMarkPaid} />}
      <Item icon={<Edit size={14} />} label="Edit Invoice" onClick={() => {}} />
      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
      {inv.status !== 'PAID' && <Item icon={<Trash2 size={14} />} label="Delete" onClick={onDelete} danger />}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function InvoiceListView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, limit, debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await invoiceService.getInvoices({ page, limit, search: debouncedSearch, status: statusFilter || undefined });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess: () => { toast.success('Invoice deleted'); queryClient.invalidateQueries({ queryKey: ['invoices'] }); setDeleteId(null); },
  });

  const sendMutation = useMutation({
    mutationFn: invoiceService.sendToClient,
    onSuccess: () => { toast.success('Invoice sent to client'); queryClient.invalidateQueries({ queryKey: ['invoices'] }); },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      invoiceService.updateStatus(id, { status: 'PAID', paidAmount: parseFloat(amount), paidAt: new Date().toISOString() }),
    onSuccess: () => { toast.success('Invoice marked as paid'); queryClient.invalidateQueries({ queryKey: ['invoices'] }); setMarkPaidInvoice(null); },
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, inv: Invoice) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, invoice: inv });
  }, []);

  const invoices: Invoice[] = data?.data || [];
  const meta = data?.meta;
  const statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{meta?.total ?? 0} invoices</p>
        </div>
        <button onClick={() => navigate('/invoices/generate')} className="btn-primary">
          <Plus size={16} /> Generate Invoice
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by invoice number or client..."
              className="form-input pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['', ...statuses].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-primary-800 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50',
                )}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="table-header px-4 py-3 text-left">Invoice #</th>
                <th className="table-header px-4 py-3 text-left">Client</th>
                <th className="table-header px-4 py-3 text-left hidden md:table-cell">Date</th>
                <th className="table-header px-4 py-3 text-right hidden sm:table-cell">Amount</th>
                <th className="table-header px-4 py-3 text-left">Status</th>
                <th className="table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Receipt size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 text-sm">No invoices found</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv: Invoice) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  return (
                    <tr
                      key={inv.id}
                      onContextMenu={(e) => handleContextMenu(e, inv)}
                      className={cn(
                        'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/row',
                        isExpanded && 'bg-primary-50/40 dark:bg-primary-900/10',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 group/inv">
                          <span className="font-mono text-sm font-medium text-primary-700 dark:text-primary-400">{inv.invoiceNumber}</span>
                          <button
                            onClick={() => setExpandedInvoiceId((p) => p === inv.id ? null : inv.id)}
                            title="Quick view"
                            className={cn(
                              'p-0.5 rounded transition-all',
                              isExpanded
                                ? 'text-primary-600 opacity-100'
                                : 'text-slate-300 opacity-0 group-hover/inv:opacity-100 hover:text-primary-500',
                            )}
                          >
                            <PanelRight size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 table-cell">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.client?.companyName}</p>
                          <p className="text-xs text-slate-500">{inv.client?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">
                        {formatDate(inv.invoiceDate)}
                        {inv.dueDate && <p className="text-xs text-slate-400">Due: {formatDate(inv.dueDate)}</p>}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(inv.totalAmount)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge', getStatusColor(inv.status))}>{inv.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => invoiceService.downloadPDF(inv.id, inv.invoiceNumber)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => sendMutation.mutate(inv.id)}
                                disabled={sendMutation.isPending}
                                className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500"
                                title="Send to Client"
                              >
                                <Send size={14} />
                              </button>
                              <button
                                onClick={() => { setMarkPaidInvoice(inv); setPaidAmount(inv.totalAmount.toString()); }}
                                className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500"
                                title="Mark as Paid"
                              >
                                <CheckCircle size={14} />
                              </button>
                            </>
                          )}
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => setDeleteId(inv.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Invoice"
        message="This will permanently delete the invoice and its PDF."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />

      <Modal isOpen={!!markPaidInvoice} onClose={() => setMarkPaidInvoice(null)} title="Mark Invoice as Paid" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Amount Received (₹)</label>
            <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} type="number" className="form-input" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setMarkPaidInvoice(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => markPaidInvoice && markPaidMutation.mutate({ id: markPaidInvoice.id, amount: paidAmount })}
              disabled={markPaidMutation.isPending}
              className="btn-primary"
            >
              {markPaidMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </Modal>

      {expandedInvoiceId && (
        <InvoiceQuickPanel
          id={expandedInvoiceId}
          onClose={() => setExpandedInvoiceId(null)}
          onMarkPaid={(inv) => { setMarkPaidInvoice(inv); setPaidAmount(inv.totalAmount.toString()); setExpandedInvoiceId(null); }}
          onSend={(id) => sendMutation.mutate(id)}
        />
      )}

      {contextMenu && (
        <InvoiceContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onView={() => setExpandedInvoiceId(contextMenu.invoice.id)}
          onDownload={() => invoiceService.downloadPDF(contextMenu.invoice.id, contextMenu.invoice.invoiceNumber)}
          onSend={() => sendMutation.mutate(contextMenu.invoice.id)}
          onMarkPaid={() => { setMarkPaidInvoice(contextMenu.invoice); setPaidAmount(contextMenu.invoice.totalAmount.toString()); }}
          onDelete={() => setDeleteId(contextMenu.invoice.id)}
        />
      )}
    </div>
  );
}
