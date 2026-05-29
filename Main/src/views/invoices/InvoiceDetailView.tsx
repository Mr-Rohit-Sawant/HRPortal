import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Send, FileText, Calendar, CreditCard, Building2 } from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { formatDate, cn } from '../../utils/helpers';
import CopyButton from '../../components/common/CopyButton';
import { InvoiceStatus } from '../../types';

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  DRAFT: 'badge-secondary',
  SENT: 'badge-info',
  PAID: 'badge-success',
  OVERDUE: 'badge-danger',
  CANCELLED: 'badge-danger',
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

export default function InvoiceDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await invoiceService.getInvoiceById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-700" />)}
    </div>
  );

  if (!data) return <div className="text-center py-16 text-slate-400">Invoice not found</div>;

  const handleDownload = () => invoiceService.downloadPDF(id!, data.invoiceNumber);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft size={18} />
          </button>
          <h1 className="page-title">Invoice {data.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{data.invoiceNumber}</h2>
              <span className={cn('badge', STATUS_BADGE[data.status] || 'badge-secondary')}>{data.status}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.client?.companyName || 'No client'}</p>
            {data.client?.email && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                {data.client.email}<CopyButton value={data.client.email} />
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{Number(data.totalAmount).toLocaleString('en-IN')}</p>
            {data.paidAmount != null && data.paidAmount > 0 && (
              <p className="text-sm text-green-600 dark:text-green-400">Paid: ₹{Number(data.paidAmount).toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Invoice Details */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <FileText size={15} /> Invoice Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Invoice Number" value={data.invoiceNumber} />
            <InfoRow label="Status" value={data.status} />
            <InfoRow label="Invoice Date" value={formatDate(data.invoiceDate)} />
            <InfoRow label="Due Date" value={data.dueDate ? formatDate(data.dueDate) : null} />
            <InfoRow label="Created" value={formatDate(data.createdAt)} />
          </div>
          {data.serviceDescription && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400 dark:text-slate-500">Service Description</span>
              <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{data.serviceDescription}</p>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <CreditCard size={15} /> Payment Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="text-slate-800 dark:text-slate-200">₹{Number(data.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {data.cgstAmount != null && data.cgstAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">CGST ({data.cgstRate}%)</span>
                <span className="text-slate-800 dark:text-slate-200">₹{Number(data.cgstAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {data.sgstAmount != null && data.sgstAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">SGST ({data.sgstRate}%)</span>
                <span className="text-slate-800 dark:text-slate-200">₹{Number(data.sgstAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {data.igstAmount != null && data.igstAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">IGST ({data.igstRate}%)</span>
                <span className="text-slate-800 dark:text-slate-200">₹{Number(data.igstAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300">Total Amount</span>
              <span className="text-slate-900 dark:text-white">₹{Number(data.totalAmount).toLocaleString('en-IN')}</span>
            </div>
            {data.paidAmount != null && data.paidAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Paid Amount</span>
                <span className="text-green-600 dark:text-green-400">₹{Number(data.paidAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <InfoRow label="Payment Method" value={data.paymentMethod} />
            <InfoRow label="Paid At" value={data.paidAt ? formatDate(data.paidAt) : null} />
          </div>
        </div>
      </div>

      {/* Line Items */}
      {data.lineItems && data.lineItems.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <FileText size={15} /> Line Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-2 text-xs text-slate-400 font-medium">Description</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Qty</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Rate</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                    <td className="py-2.5 text-slate-800 dark:text-slate-200">{item.description}</td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">₹{Number(item.rate).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{data.notes}</p>
        </div>
      )}
    </div>
  );
}
