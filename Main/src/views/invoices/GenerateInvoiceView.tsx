import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Save, Briefcase, User } from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { clientService } from '../../services/clientService';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface LineItem { description: string; quantity: number; rate: number; }

export default function GenerateInvoiceView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const prefillClientId = searchParams.get('clientId') || '';
  const prefillJobTitle = searchParams.get('jobTitle') || '';
  const prefillCandidateName = searchParams.get('candidateName') || '';
  const prefillCtcOffered = parseFloat(searchParams.get('ctcOffered') || '0') || 0;

  const defaultDescription = prefillCandidateName && prefillJobTitle
    ? `Recruitment Services – ${prefillCandidateName} for ${prefillJobTitle}`
    : prefillCandidateName
      ? `Recruitment Services – ${prefillCandidateName}`
      : 'Recruitment Services';

  const [lineItems, setLineItems] = useState<LineItem[]>([{
    description: defaultDescription,
    quantity: 1,
    rate: prefillCtcOffered,
  }]);
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST'>('CGST_SGST');
  const [taxRate, setTaxRate] = useState(18);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { clientId: prefillClientId, dueDate: '', notes: '' },
  });

  const clientId = watch('clientId');

  const { data: clientsData } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: async () => { const res = await clientService.getDropdown(); return res.data.data || []; },
  });

  const createMutation = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess: () => { toast.success('Invoice generated!'); queryClient.invalidateQueries({ queryKey: ['invoices'] }); navigate('/invoices'); },
  });

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const halfRate = taxRate / 2;
  const cgst = gstType === 'CGST_SGST' ? subtotal * (halfRate / 100) : 0;
  const sgst = gstType === 'CGST_SGST' ? subtotal * (halfRate / 100) : 0;
  const igst = gstType === 'IGST' ? subtotal * (taxRate / 100) : 0;
  const total = subtotal + cgst + sgst + igst;

  const addItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);
  const removeItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map((item, idx) => idx === i ? { ...item, [field]: field === 'description' ? value : Number(value) } : item));
  };

  const onSubmit = (data: any) => {
    createMutation.mutate({
      clientId: data.clientId,
      dueDate: data.dueDate || undefined,
      serviceDescription: lineItems[0]?.description,
      lineItems,
      gstType,
      cgstRate: gstType === 'CGST_SGST' ? halfRate : undefined,
      sgstRate: gstType === 'CGST_SGST' ? halfRate : undefined,
      igstRate: gstType === 'IGST' ? taxRate : undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={18} />
        </button>
        <h1 className="page-title">Generate Invoice</h1>
      </div>

      {(prefillJobTitle || prefillCandidateName) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {prefillCandidateName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
              <User size={14} />
              <span className="font-medium">{prefillCandidateName}</span>
            </div>
          )}
          {prefillJobTitle && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-sm">
              <Briefcase size={14} />
              <span className="font-medium">{prefillJobTitle}</span>
            </div>
          )}
          {prefillCtcOffered > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm">
              <span className="font-medium">CTC: {formatCurrency(prefillCtcOffered)}</span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-5">
            {/* Client */}
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Invoice Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Client *</label>
                  <select {...register('clientId', { required: true })} className="form-input">
                    <option value="">Select Client</option>
                    {clientsData?.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input {...register('dueDate')} type="date" className="form-input" />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">Services / Line Items</h2>
                <button type="button" onClick={addItem} className="btn-secondary text-xs py-1.5">
                  <Plus size={14} /> Add Row
                </button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-2">Rate (₹)</span>
                  <span className="col-span-1 text-right">Amount</span>
                  <span className="col-span-1" />
                </div>
                {lineItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                      className="form-input col-span-6 text-sm"
                      placeholder="Service description"
                    />
                    <input
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      type="number" min="1" className="form-input col-span-2 text-sm"
                    />
                    <input
                      value={item.rate}
                      onChange={(e) => updateItem(i, 'rate', e.target.value)}
                      type="number" min="0" className="form-input col-span-2 text-sm"
                    />
                    <span className="col-span-1 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(item.quantity * item.rate)}
                    </span>
                    <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center" disabled={lineItems.length === 1}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="card p-5">
              <label className="form-label">Notes</label>
              <textarea {...register('notes')} rows={3} className="form-input resize-none" placeholder="Payment terms, bank details, remarks..." />
            </div>
          </div>

          {/* Tax & Summary */}
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">GST Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs">GST Type</label>
                  <div className="flex gap-2">
                    {(['CGST_SGST', 'IGST'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setGstType(type)}
                        className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors ${
                          gstType === type
                            ? 'bg-primary-800 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {type === 'CGST_SGST' ? 'CGST + SGST' : 'IGST'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs">Tax Rate (%)</label>
                  <select value={taxRate} onChange={(e) => setTaxRate(parseInt(e.target.value))} className="form-input">
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                    <option value="0">No Tax</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {gstType === 'CGST_SGST' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">CGST ({halfRate}%)</span>
                      <span>{formatCurrency(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">SGST ({halfRate}%)</span>
                      <span>{formatCurrency(sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">IGST ({taxRate}%)</span>
                    <span>{formatCurrency(igst)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary-700 dark:text-primary-400 text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button type="submit" disabled={createMutation.isPending || !clientId} className="btn-primary justify-center">
                {createMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                Generate Invoice
              </button>
              <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary justify-center">Cancel</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
