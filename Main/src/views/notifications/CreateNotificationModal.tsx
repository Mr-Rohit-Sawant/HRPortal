import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Paperclip, ChevronDown, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { notificationService } from '../../services/notificationService';
import { employeeService } from '../../services/employeeService';
import { clientService } from '../../services/clientService';
import { businessService } from '../../services/businessService';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/helpers';

interface Employee { id: string; firstName: string; lastName: string; }
interface Client { id: string; companyName: string; }
interface BusinessOption { id: string; name: string; code: string; }
interface Props { isOpen: boolean; onClose: () => void; }

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png';

export default function CreateNotificationModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = !!user?.isSuperAdmin;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');

  const [sendToOpen, setSendToOpen] = useState(false);
  const [sendToSearch, setSendToSearch] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0, width: 240 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionTriggerIdx = useRef<number>(-1);
  const sendToRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sendToRef.current && !sendToRef.current.contains(e.target as Node)) setSendToOpen(false);
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setClientOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data: employeesData } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: async () => (await employeeService.getEmployees({ limit: 500 })).data.data as Employee[] ?? [],
    enabled: isOpen,
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: async () => (await clientService.getClients({ limit: 500 })).data.data as Client[] ?? [],
    enabled: isOpen && !isSuperAdmin,
  });

  const { data: businessesData } = useQuery({
    queryKey: ['businesses-dropdown'],
    queryFn: async () => (await businessService.getDropdown()).data.data as BusinessOption[] ?? [],
    enabled: isOpen && isSuperAdmin,
  });

  const employees = employeesData ?? [];
  const clients = clientsData ?? [];
  const businesses = businessesData ?? [];

  const filteredEmployees = employees.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(sendToSearch.toLowerCase())
  );
  const filteredClients = clients.filter(c =>
    c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => notificationService.create(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      toast.success('Notification created');
      handleClose();
    },
    onError: () => toast.error('Failed to create notification'),
  });

  const handleClose = () => {
    setTitle(''); setDescription('');
    setSendToAll(true); setSelectedEmployees([]);
    setSelectedClients([]);
    setAttachedFiles([]); setMentionOpen(false);
    setSendToOpen(false); setClientOpen(false);
    setSendToSearch(''); setClientSearch('');
    setSelectedBusinessId('');
    onClose();
  };

  // ── Send To ───────────────────────────────────────────────────────────────

  const toggleAll = () => { setSendToAll(true); setSelectedEmployees([]); };

  const toggleEmployee = (emp: Employee) => {
    setSendToAll(false);
    setSelectedEmployees(prev => {
      const exists = prev.find(e => e.id === emp.id);
      return exists ? prev.filter(e => e.id !== emp.id) : [...prev, emp];
    });
  };

  const removeEmployee = (id: string) => {
    const after = selectedEmployees.filter(e => e.id !== id);
    setSelectedEmployees(after);
    if (after.length === 0) setSendToAll(true);
  };

  const sendToLabel = sendToAll
    ? 'All Employees'
    : selectedEmployees.length === 1
      ? `${selectedEmployees[0].firstName} ${selectedEmployees[0].lastName}`
      : `${selectedEmployees.length} employees selected`;

  // ── Clients ───────────────────────────────────────────────────────────────

  const toggleClient = (c: Client) => {
    setSelectedClients(prev => {
      const exists = prev.find(x => x.id === c.id);
      return exists ? prev.filter(x => x.id !== c.id) : [...prev, c];
    });
    setClientSearch('');
  };

  // ── Files ─────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachedFiles(prev => [...prev, ...Array.from(e.target.files ?? [])]);
    e.target.value = '';
  };

  // ── @Mention ──────────────────────────────────────────────────────────────

  const getCursorXY = (textarea: HTMLTextAreaElement, position: number) => {
    const style = window.getComputedStyle(textarea);
    const mirror = document.createElement('div');
    const props = ['boxSizing','width','paddingTop','paddingRight','paddingBottom','paddingLeft',
      'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
      'fontStyle','fontVariant','fontWeight','fontStretch','fontSize','lineHeight','fontFamily',
      'letterSpacing','wordSpacing','whiteSpace','wordBreak','overflowWrap'];
    props.forEach(p => { mirror.style[p as any] = style[p as keyof CSSStyleDeclaration] as string; });
    mirror.style.position = 'absolute';
    mirror.style.top = '0';
    mirror.style.left = '0';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.height = 'auto';
    mirror.style.overflow = 'hidden';
    const textBefore = textarea.value.substring(0, position);
    mirror.textContent = textBefore;
    const cursor = document.createElement('span');
    cursor.textContent = '​';
    mirror.appendChild(cursor);
    document.body.appendChild(mirror);
    const taRect = textarea.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const spanRect = cursor.getBoundingClientRect();
    const relTop = spanRect.top - mirrorRect.top;
    const relLeft = spanRect.left - mirrorRect.left;
    document.body.removeChild(mirror);
    return {
      top: taRect.top + relTop - textarea.scrollTop + parseFloat(style.lineHeight || '20'),
      left: Math.min(taRect.left + relLeft, taRect.right - 260),
    };
  };

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);

    const ta = textareaRef.current;
    if (!ta) return;

    const cursor = ta.selectionStart ?? 0;
    const text = value.slice(0, cursor);
    const atIdx = text.lastIndexOf('@');

    if (atIdx === -1) { setMentionOpen(false); return; }
    if (atIdx > 0 && !/[\s]/.test(text[atIdx - 1])) { setMentionOpen(false); return; }

    const query = text.slice(atIdx + 1);
    if (/\s/.test(query)) { setMentionOpen(false); return; }

    mentionTriggerIdx.current = atIdx;
    setMentionQuery(query);

    const { top, left } = getCursorXY(ta, atIdx);
    setMentionPos({ top: top + window.scrollY, left: left + window.scrollX, width: 240 });
    setMentionOpen(true);
  }, []);

  const selectMention = (emp: Employee) => {
    const ta = textareaRef.current;
    if (!ta || mentionTriggerIdx.current === -1) return;
    const before = description.slice(0, mentionTriggerIdx.current);
    const after = description.slice(ta.selectionStart ?? 0);
    const mention = `@${emp.firstName}.${emp.lastName}`;
    setDescription(before + mention + ' ' + after);
    setMentionOpen(false);
    mentionTriggerIdx.current = -1;
    setTimeout(() => {
      ta.focus();
      const pos = (before + mention + ' ').length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const filteredMention = employees.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 8);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { toast.error('Title and description are required'); return; }
    if (!sendToAll && selectedEmployees.length === 0) { toast.error('Select at least one recipient'); return; }

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('sendTo', sendToAll ? JSON.stringify('ALL') : JSON.stringify(selectedEmployees.map(e => e.id)));
    if (!isSuperAdmin && selectedClients.length > 0) fd.append('clientId', selectedClients[0].id);
    if (isSuperAdmin && selectedBusinessId) fd.append('businessId', selectedBusinessId);
    attachedFiles.forEach(f => fd.append('files', f));
    createMutation.mutate(fd);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Create Notification" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Business — super admin only, shown first */}
          {isSuperAdmin && (
            <div>
              <label className="form-label">Business <span className="text-xs text-slate-400 font-normal">(optional — leave blank for all businesses)</span></label>
              <select
                value={selectedBusinessId}
                onChange={e => setSelectedBusinessId(e.target.value)}
                className="form-input"
              >
                <option value="">All businesses</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Send To — custom multi-select dropdown */}
          <div ref={sendToRef} className="relative">
            <label className="form-label">Send To</label>
            <button
              type="button"
              onClick={() => setSendToOpen(v => !v)}
              className="form-input flex items-center justify-between w-full text-left"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">{sendToLabel}</span>
              <ChevronDown size={16} className={cn('text-slate-400 transition-transform flex-shrink-0', sendToOpen && 'rotate-180')} />
            </button>

            {sendToOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={sendToSearch}
                      onChange={e => setSendToSearch(e.target.value)}
                      placeholder="Search employees…"
                      className="form-input pl-8 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {!sendToSearch && (
                    <div
                      onClick={toggleAll}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50"
                    >
                      <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors', sendToAll ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-500')}>
                        {sendToAll && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">All Employees</span>
                    </div>
                  )}
                  {filteredEmployees.map(emp => {
                    const sel = !sendToAll && selectedEmployees.some(e => e.id === emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp)}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors', sel ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-500')}>
                          {sel && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{emp.firstName} {emp.lastName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!sendToAll && selectedEmployees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedEmployees.map(e => (
                  <span key={e.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs">
                    {e.firstName} {e.lastName}
                    <button type="button" onClick={() => removeEmployee(e.id)} className="hover:text-primary-900 ml-0.5"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="form-label">Title *</label>
            <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" required />
          </div>

          {/* Description + @mention */}
          <div>
            <label className="form-label">
              Description * <span className="text-xs text-slate-400 font-normal">(type @ to mention)</span>
            </label>
            <textarea
              ref={textareaRef}
              className="form-input min-h-[120px] resize-y"
              value={description}
              onChange={handleDescriptionChange}
              onBlur={() => setTimeout(() => setMentionOpen(false), 150)}
              placeholder="Write your notification…"
            />
          </div>

          {/* Client — custom searchable multi-select (business users only) */}
          {!isSuperAdmin && <div ref={clientRef} className="relative">
            <label className="form-label">Client <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
            <button
              type="button"
              onClick={() => setClientOpen(v => !v)}
              className="form-input flex items-center justify-between w-full text-left"
            >
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedClients.length === 0 ? 'Select client…' : `${selectedClients.length} selected`}
              </span>
              <ChevronDown size={16} className={cn('text-slate-400 transition-transform flex-shrink-0', clientOpen && 'rotate-180')} />
            </button>

            {clientOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      placeholder="Search clients…"
                      className="form-input pl-8 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredClients.map(c => {
                    const sel = selectedClients.some(x => x.id === c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleClient(c)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors', sel ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-500')}>
                          {sel && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{c.companyName}</span>
                      </div>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4">No clients found</p>
                  )}
                </div>
              </div>
            )}

            {selectedClients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedClients.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                    {c.companyName}
                    <button type="button" onClick={() => setSelectedClients(p => p.filter(x => x.id !== c.id))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>}

          {/* Attach Files */}
          <div>
            <label className="form-label">Attach Files <span className="text-xs text-slate-400 font-normal">(pdf, doc, ppt, images)</span></label>
            <label className={cn('flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors')}>
              <Paperclip size={16} className="text-slate-400" />
              <span className="text-sm text-slate-500">Click to attach files</span>
              <input type="file" className="hidden" multiple accept={ACCEPTED_FILE_TYPES} onChange={handleFileChange} />
            </label>
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {attachedFiles.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                    <Paperclip size={10} />{f.name}
                    <button type="button" onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create Notification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* @mention floating list — rendered outside Modal to avoid overflow clipping */}
      {mentionOpen && filteredMention.length > 0 && (
        <div
          className="fixed z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden"
          style={{ top: mentionPos.top, left: mentionPos.left, width: mentionPos.width }}
        >
          {filteredMention.map(emp => (
            <button
              key={emp.id}
              type="button"
              onMouseDown={() => selectMention(emp)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs flex items-center justify-center font-medium flex-shrink-0">
                {emp.firstName[0]}{emp.lastName[0]}
              </div>
              {emp.firstName} {emp.lastName}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
