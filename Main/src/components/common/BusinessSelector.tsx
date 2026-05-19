import { Building2 } from 'lucide-react';
import { cn } from '../../utils/helpers';
import BusinessSearchSelect from './BusinessSearchSelect';

interface Props {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function BusinessSelector({ value, onChange, className }: Props) {
  return (
    <div className={cn('card p-5 border-2 border-primary-200 dark:border-primary-800/40', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Building2 size={16} className="text-primary-600" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Business *</span>
      </div>
      <div className="max-w-md">
        <BusinessSearchSelect
          value={value}
          onChange={onChange}
          placeholder="— Choose a business to continue —"
        />
      </div>
      {!value && (
        <p className="text-xs text-slate-400 mt-2">Select a business to expand the form</p>
      )}
    </div>
  );
}
