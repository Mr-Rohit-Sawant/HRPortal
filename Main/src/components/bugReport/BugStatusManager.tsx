import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, GripVertical, Check, Pencil } from 'lucide-react';
import { bugReportService } from '../../services/bugReportService';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface StatusLabel { id: string; name: string; color: string; order: number; isArchived: boolean; }

const PRESET_COLORS = [
  '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6',
  '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#06B6D4',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [custom, setCustom] = useState(value);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c} type="button"
          onClick={() => onChange(c)}
          className={cn('w-6 h-6 rounded-full transition-transform hover:scale-110 border-2', value === c ? 'border-slate-700 scale-110' : 'border-transparent')}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={custom}
        onChange={e => { setCustom(e.target.value); onChange(e.target.value); }}
        className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
        title="Custom color"
      />
    </div>
  );
}

function LabelRow({ label, onSave, onDelete }: {
  label: StatusLabel;
  onSave: (id: string, data: Partial<StatusLabel>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(label.name);
  const [color, setColor]     = useState(label.color);

  const save = () => {
    if (!name.trim()) return;
    onSave(label.id, { name: name.trim(), color });
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group">
      <GripVertical size={14} className="text-slate-300 flex-shrink-0 cursor-grab" />

      {editing ? (
        <>
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <input
            autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="form-input text-sm flex-1 py-1"
          />
          <div className="flex-shrink-0">
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <button onClick={save} className="p-1 rounded bg-primary-600 text-white flex-shrink-0"><Check size={12} /></button>
          <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"><X size={12} /></button>
        </>
      ) : (
        <>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
          <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate">{label.name}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"><Pencil size={12} /></button>
            <button onClick={() => onDelete(label.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"><Trash2 size={12} /></button>
          </div>
        </>
      )}
    </div>
  );
}

interface Props { onClose: () => void; businessId?: string; }

export default function BugStatusManager({ onClose, businessId }: Props) {
  const queryClient = useQueryClient();
  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');

  const { data: labels = [], isLoading } = useQuery<StatusLabel[]>({
    queryKey: ['bug-status-labels', businessId],
    queryFn: async () => {
      const res = await bugReportService.getStatusLabels({ businessId });
      return (res.data.data || []).filter((l: StatusLabel) => !l.isArchived);
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bug-status-labels'] });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string; businessId?: string }) =>
      bugReportService.createStatusLabel(data),
    onSuccess: () => { invalidate(); setNewName(''); setNewColor('#3B82F6'); toast.success('Label created'); },
    onError: () => toast.error('Failed to create label'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StatusLabel> }) =>
      bugReportService.updateStatusLabel(id, data),
    onSuccess: () => { invalidate(); toast.success('Label updated'); },
    onError: () => toast.error('Failed to update label'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bugReportService.deleteStatusLabel(id),
    onSuccess: () => { invalidate(); toast.success('Label deleted'); },
    onError: () => toast.error('Failed to delete label'),
  });

  const handleCreate = () => {
    if (!newName.trim()) { toast.error('Label name required'); return; }
    createMutation.mutate({ name: newName.trim(), color: newColor, businessId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Manage Status Labels</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X size={16} /></button>
        </div>

        {/* Labels */}
        <div className="p-4 max-h-72 overflow-y-auto space-y-1.5">
          {isLoading ? (
            <div className="text-center py-6 text-slate-400 text-sm">Loading…</div>
          ) : labels.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-sm">No labels yet. Create one below.</p>
          ) : labels.map(label => (
            <LabelRow
              key={label.id}
              label={label}
              onSave={(id, data) => updateMutation.mutate({ id, data })}
              onDelete={id => deleteMutation.mutate(id)}
            />
          ))}
        </div>

        {/* Create new */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Label</p>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: newColor }} />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="Label name…"
              className="form-input text-sm flex-1"
            />
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !newName.trim()}
            className="btn-primary w-full text-sm py-2 gap-1.5"
          >
            <Plus size={14} /> Add Label
          </button>
        </div>
      </div>
    </div>
  );
}
