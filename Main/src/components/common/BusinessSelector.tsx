import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { cn } from '../../utils/helpers';

interface Props {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function BusinessSelector({ value, onChange, className }: Props) {
  const { data: businesses } = useQuery({
    queryKey: ['businesses-dropdown'],
    queryFn: async () => { const res = await businessService.getDropdown(); return res.data.data || []; },
  });

  return (
    <div className={cn('card p-5 border-2 border-primary-200 dark:border-primary-800/40', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Building2 size={16} className="text-primary-600" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Business *</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('form-input max-w-md', !value && 'text-slate-400 dark:text-slate-500')}
      >
        <option value="">— Choose a business to continue —</option>
        {businesses?.map((b: any) => (
          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
        ))}
      </select>
      {!value && (
        <p className="text-xs text-slate-400 mt-2">Select a business to expand the form</p>
      )}
    </div>
  );
}
