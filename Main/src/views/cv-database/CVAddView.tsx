import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, X, Upload, Save, User, ChevronDown, Check,
  GraduationCap, Trash2, Briefcase, MapPin, Circle,
} from 'lucide-react';
import { cvService } from '../../services/cvService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../utils/helpers';
import PhoneInputField from '../../components/common/PhoneInput';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[0-9]{5,15}$/, 'Only digits and leading + allowed').optional().or(z.literal('')),
  alternatePhone: z.string().regex(/^\+?[0-9]{5,15}$/, 'Only digits and leading + allowed').optional().or(z.literal('')),
  currentLocation: z.string().optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  totalExperience: z.string().optional(),
  currentCTC: z.string().optional(),
  expectedCTC: z.string().optional(),
  noticePeriod: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Location data ────────────────────────────────────────────────────────────

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'UAE', 'Singapore', 'Germany', 'France', 'Netherlands', 'Switzerland',
  'New Zealand', 'Japan', 'South Korea', 'China', 'Malaysia', 'Saudi Arabia',
  'Qatar', 'Bahrain', 'Kuwait', 'Oman', 'South Africa', 'Other',
];

const STATES_BY_COUNTRY: Record<string, string[]> = {
  'India': [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi (NCT)', 'Chandigarh', 'Puducherry',
  ],
  'United States': [
    'California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania',
    'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
    'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Maryland',
  ],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan'],
  'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  'Singapore': ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'],
};

const CITIES_BY_STATE: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Navi Mumbai', 'Kolhapur', 'Amravati'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Davangere', 'Bellary', 'Bijapur', 'Shimoga'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Secunderabad'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati'],
  'Delhi (NCT)': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini', 'Saket'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Noida', 'Ghaziabad'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Haldia'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Hisar', 'Rohtak', 'Ambala', 'Karnal', 'Panipat', 'Sonipat'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kannur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  // International
  'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Oakland'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Yonkers'],
  'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
  'England': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Sheffield', 'Liverpool'],
  'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London'],
  'British Columbia': ['Vancouver', 'Victoria', 'Kelowna', 'Abbotsford'],
  'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Parramatta'],
  'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo'],
  'Dubai': ['Dubai City', 'Deira', 'Bur Dubai', 'Jumeirah', 'Business Bay'],
  'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Khalifa City'],
};

// ─── Predefined suggestions ───────────────────────────────────────────────────

const LANG_SUGGESTIONS = [
  'English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada',
  'Bengali', 'Punjabi', 'Malayalam', 'Odia', 'Urdu', 'French', 'German',
  'Spanish', 'Chinese', 'Japanese', 'Arabic',
];
const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
  'Python', 'Java', 'C++', 'C#', 'PHP', 'Go', 'SQL', 'MongoDB',
  'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
  'GCP', 'Git', 'REST API', 'GraphQL', 'HTML', 'CSS', 'Tailwind CSS',
  'Next.js', 'Express', 'Spring Boot', 'Django', 'Laravel',
];
const TECH_SUGGESTIONS = [
  'MERN', 'MEAN', 'LAMP', 'JAMstack', 'Serverless', 'Microservices',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'DevOps', 'CI/CD',
  'Spring Boot', 'Django', 'Laravel', 'Rails', '.NET', 'Java EE',
];
const CERT_SUGGESTIONS = [
  'AWS Certified', 'Google Cloud Certified', 'Azure Certified', 'PMP',
  'Scrum Master', 'CISSP', 'CEH', 'CompTIA Security+', 'CCNA', 'ITIL',
];
const LOCATION_SUGGESTIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Noida', 'Gurgaon', 'Chandigarh',
];

const QUALIFICATION_OPTIONS = [
  '10th', '12th', 'Diploma', 'B.A.', 'B.Com', 'B.Sc.', 'B.Tech/B.E.',
  'BBA', 'BCA', 'M.A.', 'M.Com', 'M.Sc.', 'M.Tech', 'MBA', 'MCA', 'PhD', 'Other',
];
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer Not to Say'];
const GENDER_VALUES: Record<string, string> = {
  'Male': 'MALE', 'Female': 'FEMALE', 'Other': 'OTHER', 'Prefer Not to Say': 'PREFER_NOT_TO_SAY',
};
const GENDER_LABELS: Record<string, string> = {
  'MALE': 'Male', 'FEMALE': 'Female', 'OTHER': 'Other', 'PREFER_NOT_TO_SAY': 'Prefer Not to Say',
};
const SOURCE_OPTIONS = [
  'Naukri', 'LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Direct Application', 'Other',
];
const DEFAULT_RELIGION_OPTIONS = [
  'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Jewish', 'Other',
];
const DEFAULT_CASTE_OPTIONS = [
  'General / Open', 'Scheduled Caste (SC)', 'Scheduled Tribe (ST)', 'OBC', 'Other',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Experience {
  designation: string;
  company: string;
  joiningDate: string;
  endDate: string;
  currentlyWorking: boolean;
  skills: string[];
}

interface Education {
  qualification: string;
  specialization: string;
  university: string;
  passingYear: string;
}

const EMPTY_EXP: Experience = {
  designation: '', company: '', joiningDate: '', endDate: '', currentlyWorking: false, skills: [],
};
const EMPTY_EDU: Education = { qualification: '', specialization: '', university: '', passingYear: '' };

// ─── CustomSelect ─────────────────────────────────────────────────────────────

interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  onAddOption?: (v: string) => void;
  canAddOptions?: boolean;
  placeholder?: string;
  displayMap?: Record<string, string>;
  valueMap?: Record<string, string>;
  className?: string;
}

function CustomSelect({
  value, onChange, options, onAddOption, canAddOptions,
  placeholder = 'Select', displayMap, valueMap, className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [newOpt, setNewOpt] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const displayValue = value ? (displayMap?.[value] ?? value) : '';

  const handleSelect = (opt: string) => {
    onChange(valueMap?.[opt] ?? opt);
    setOpen(false);
  };

  const handleAddNew = () => {
    const t = newOpt.trim();
    if (!t) return;
    onAddOption?.(t);
    onChange(valueMap?.[t] ?? t);
    setNewOpt('');
    setAddingNew(false);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn('form-input w-full flex items-center justify-between text-left', !value && 'text-slate-400 dark:text-slate-500')}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <ChevronDown size={14} className={cn('flex-shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-60 flex flex-col">
          <div className="overflow-y-auto flex-1">
            {options.map((opt) => {
              const mapped = valueMap?.[opt] ?? opt;
              const isSelected = value === mapped;
              return (
                <button key={opt} type="button" onClick={() => handleSelect(opt)}
                  className={cn('w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60',
                  )}>
                  <Check size={13} className={cn('flex-shrink-0', isSelected ? 'opacity-100 text-primary-600' : 'opacity-0')} />
                  {opt}
                </button>
              );
            })}
          </div>
          {canAddOptions && (
            <div className="border-t border-slate-100 dark:border-slate-700 p-2">
              {addingNew ? (
                <div className="flex gap-1.5">
                  <input autoFocus value={newOpt}
                    onChange={(e) => setNewOpt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); } if (e.key === 'Escape') setAddingNew(false); }}
                    placeholder="New option..." className="form-input flex-1 text-xs py-1" />
                  <button type="button" onClick={handleAddNew} className="btn-primary px-2 py-1 text-xs"><Check size={12} /></button>
                  <button type="button" onClick={() => setAddingNew(false)} className="btn-secondary px-2 py-1 text-xs"><X size={12} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingNew(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                  <Plus size={11} /> Add new option
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DateInput ────────────────────────────────────────────────────────────────

function DateInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <input ref={ref} type="date" value={value} onChange={(e) => onChange(e.target.value)}
      onClick={() => { try { ref.current?.showPicker(); } catch { /* browser fallback */ } }}
      placeholder={placeholder} className={cn('form-input cursor-pointer', className)} />
  );
}

// ─── TagInputField ─────────────────────────────────────────────────────────────
// Defined OUTSIDE parent — prevents React from re-mounting on every render (fixes focus loss).

interface TagInputFieldProps {
  list: string[];
  onListChange: (list: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

function TagInputField({ list, onListChange, suggestions = [], placeholder }: TagInputFieldProps) {
  const [inputVal, setInputVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSuggestions) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showSuggestions]);

  const addItem = useCallback((raw: string) => {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    const next = [...list];
    parts.forEach(p => { if (!next.includes(p)) next.push(p); });
    onListChange(next);
    setInputVal('');
    setShowSuggestions(false);
  }, [list, onListChange]);

  const handleChange = (val: string) => {
    if (val.includes(',')) { addItem(val); return; }
    setInputVal(val);
    setShowSuggestions(val.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); if (inputVal.trim()) addItem(inputVal); }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const filtered = inputVal.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(inputVal.toLowerCase()) && !list.includes(s))
    : [];

  return (
    <div ref={wrapRef}>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {list.map(item => (
            <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded-full">
              {item}
              <button type="button" onClick={() => onListChange(list.filter(i => i !== item))} className="hover:text-red-500 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <input value={inputVal} onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (inputVal.length > 0) setShowSuggestions(true); }}
            placeholder={placeholder} className="form-input flex-1 text-sm" />
          <button type="button" onClick={() => { if (inputVal.trim()) addItem(inputVal); }} className="btn-secondary px-3 flex-shrink-0">
            <Plus size={14} />
          </button>
        </div>
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-44 overflow-y-auto">
            {filtered.slice(0, 10).map(s => (
              <button key={s} type="button"
                onMouseDown={(e) => { e.preventDefault(); addItem(s); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phone input — re-export shared component with local alias ────────────────
const PhoneInput = PhoneInputField;

// ─── Experience card ─────────────────────────────────────────────────────────

interface ExperienceCardProps {
  exp: Experience;
  index: number;
  total: number;
  onChange: (idx: number, field: keyof Experience, val: any) => void;
  onRemove: (idx: number) => void;
  canAddDropdownOptions: boolean;
}

function ExperienceCard({ exp, index, total, onChange, onRemove, canAddDropdownOptions }: ExperienceCardProps) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0 mt-3">
        <div className="w-3 h-3 rounded-full bg-primary-600 ring-2 ring-primary-200 dark:ring-primary-900 flex-shrink-0" />
        {index < total - 1 && (
          <div className="w-0.5 flex-1 min-h-8 bg-gradient-to-b from-primary-400 to-slate-200 dark:to-slate-700 mt-1" />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 bg-white dark:bg-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
            {exp.currentlyWorking ? 'Current' : `Experience ${index + 1}`}
          </span>
          {total > 1 && (
            <button type="button" onClick={() => onRemove(index)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label text-xs">Designation *</label>
            <input value={exp.designation} onChange={(e) => onChange(index, 'designation', e.target.value)}
              className="form-input" placeholder="Software Engineer" />
          </div>
          <div>
            <label className="form-label text-xs">Company Name *</label>
            <input value={exp.company} onChange={(e) => onChange(index, 'company', e.target.value)}
              className="form-input" placeholder="ABC Corporation" />
          </div>
          <div>
            <label className="form-label text-xs">Joining Date</label>
            <DateInput value={exp.joiningDate} onChange={(v) => onChange(index, 'joiningDate', v)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label text-xs mb-0">End Date</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <div
                  onClick={() => onChange(index, 'currentlyWorking', !exp.currentlyWorking)}
                  className={cn(
                    'w-8 h-4.5 rounded-full relative transition-colors cursor-pointer',
                    exp.currentlyWorking ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600',
                  )}
                  style={{ height: '18px' }}
                >
                  <div className={cn(
                    'absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform',
                    exp.currentlyWorking ? 'translate-x-[18px]' : 'translate-x-0.5',
                  )} />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Currently Working</span>
              </label>
            </div>
            {exp.currentlyWorking ? (
              <div className="form-input bg-slate-50 dark:bg-slate-700/50 text-slate-400 text-sm flex items-center gap-1.5">
                <Circle size={8} className="text-green-500 fill-green-500 flex-shrink-0" /> Present
              </div>
            ) : (
              <DateInput value={exp.endDate} onChange={(v) => onChange(index, 'endDate', v)} />
            )}
          </div>
        </div>

        <div className="mt-3">
          <label className="form-label text-xs">Skills at this Company</label>
          <p className="text-xs text-slate-400 mb-1">Type and press Enter or comma to add</p>
          <TagInputField
            list={exp.skills}
            onListChange={(skills) => onChange(index, 'skills', skills)}
            suggestions={SKILL_SUGGESTIONS}
            placeholder="e.g. React, Python"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CVAddView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { canAccess, user } = useAuthStore();
  const isEdit = !!id;

  const canAddDropdownOptions = user?.isSuperAdmin || canAccess('dropdown:manage_options');

  // Tag lists
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);

  // Experience entries
  const [experiences, setExperiences] = useState<Experience[]>([{ ...EMPTY_EXP }]);

  // Education entries
  const [educations, setEducations] = useState<Education[]>([{ ...EMPTY_EDU }]);

  // Custom select states
  const [genderVal, setGenderVal] = useState('');
  const [sourceVal, setSourceVal] = useState('');
  const [statusVal, setStatusVal] = useState('ACTIVE');
  const [dobVal, setDobVal] = useState('');
  const [religionVal, setReligionVal] = useState('');
  const [casteVal, setCasteVal] = useState('');

  // Phone values (controlled for validation)
  const [phoneVal, setPhoneVal] = useState('');
  const [altPhoneVal, setAltPhoneVal] = useState('');

  // Location cascade
  const [countryVal, setCountryVal] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [cityVal, setCityVal] = useState('');

  // Extensible dropdown option lists
  const [qualificationOptions, setQualificationOptions] = useState<string[]>(QUALIFICATION_OPTIONS);
  const [sourceOptions, setSourceOptions] = useState<string[]>(SOURCE_OPTIONS);
  const [religionOptions, setReligionOptions] = useState<string[]>(DEFAULT_RELIGION_OPTIONS);
  const [casteOptions, setCasteOptions] = useState<string[]>(DEFAULT_CASTE_OPTIONS);

  const [cvFile, setCvFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nationality: 'Indian' },
  });

  // Available states & cities based on selected country/state
  const availableStates = useMemo(() => STATES_BY_COUNTRY[countryVal] || [], [countryVal]);
  const availableCities = useMemo(() => CITIES_BY_STATE[stateVal] || [], [stateVal]);

  const handleCountryChange = (v: string) => {
    setCountryVal(v);
    setStateVal('');
    setCityVal('');
  };
  const handleStateChange = (v: string) => {
    setStateVal(v);
    setCityVal('');
  };

  // Sorted experiences (currently working first, then by joinDate desc)
  const sortedExperiences = useMemo(() => {
    return [...experiences].sort((a, b) => {
      if (a.currentlyWorking && !b.currentlyWorking) return -1;
      if (!a.currentlyWorking && b.currentlyWorking) return 1;
      const dateA = a.joiningDate ? new Date(a.joiningDate).getTime() : 0;
      const dateB = b.joiningDate ? new Date(b.joiningDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [experiences]);

  const { data: existingData } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => { const res = await cvService.getCandidateById(id!); return res.data.data; },
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existingData) return;
    reset({
      firstName: existingData.firstName,
      lastName: existingData.lastName || '',
      email: existingData.email || '',
      currentLocation: existingData.currentLocation || '',
      nationality: existingData.nationality || 'Indian',
      totalExperience: existingData.totalExperience?.toString() || '',
      currentCTC: existingData.currentCTC?.toString() || '',
      expectedCTC: existingData.expectedCTC?.toString() || '',
      noticePeriod: existingData.noticePeriod?.toString() || '',
      notes: existingData.notes || '',
    });
    setPhoneVal(existingData.phone || '');
    setAltPhoneVal(existingData.alternatePhone || '');
    setGenderVal(existingData.gender || '');
    setSourceVal(existingData.source || '');
    setStatusVal(existingData.status || 'ACTIVE');
    setDobVal(existingData.dateOfBirth ? existingData.dateOfBirth.split('T')[0] : '');
    setReligionVal(existingData.religion || '');
    setCasteVal(existingData.caste || '');
    setCountryVal(existingData.country || '');
    setStateVal(existingData.state || '');
    setCityVal(existingData.city || '');
    setSkills(existingData.skills || []);
    setCertifications(existingData.certifications || []);
    setTechStack(existingData.technologyStack || []);
    setLanguages(existingData.languages || []);
    setPreferredLocations(existingData.preferredLocations || []);

    const edu = existingData.educationDetails;
    if (Array.isArray(edu) && edu.length > 0) {
      setEducations(edu as unknown as Education[]);
    } else if (existingData.highestQualification) {
      setEducations([{
        qualification: existingData.highestQualification || '',
        specialization: existingData.specialization || '',
        university: existingData.university || '',
        passingYear: existingData.passingYear?.toString() || '',
      }]);
    }

    const expData = existingData.experienceDetails;
    if (Array.isArray(expData) && expData.length > 0) {
      setExperiences(expData as unknown as Experience[]);
    } else if (existingData.currentDesignation) {
      setExperiences([{
        designation: existingData.currentDesignation || '',
        company: existingData.currentCompany || '',
        joiningDate: '',
        endDate: '',
        currentlyWorking: existingData.currentlyEmployed === true,
        skills: [],
      }]);
    }
  }, [existingData, reset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    onDrop: (accepted) => { if (accepted[0]) setCvFile(accepted[0]); },
  });

  const createMutation = useMutation({
    mutationFn: cvService.createCandidate,
    onSuccess: () => { toast.success('Candidate added successfully'); queryClient.invalidateQueries({ queryKey: ['candidates'] }); navigate('/cv-database'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: any }) => cvService.updateCandidate(id, fd),
    onSuccess: () => {
      toast.success('Candidate updated');
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      navigate('/cv-database');
    },
  });

  const onSubmit = (data: FormData) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v as string); });

    if (genderVal) fd.append('gender', genderVal);
    if (sourceVal) fd.append('source', sourceVal);
    if (statusVal) fd.append('status', statusVal);
    if (dobVal) fd.append('dateOfBirth', dobVal);
    if (religionVal) fd.append('religion', religionVal);
    if (casteVal) fd.append('caste', casteVal);
    if (phoneVal) fd.append('phone', phoneVal);
    if (altPhoneVal) fd.append('alternatePhone', altPhoneVal);
    if (countryVal) fd.append('country', countryVal);
    if (stateVal) fd.append('state', stateVal);
    if (cityVal) fd.append('city', cityVal);

    // Derive currentDesignation/currentCompany from the currently-working experience
    const currentExp = experiences.find(e => e.currentlyWorking) || experiences[0];
    if (currentExp?.designation) fd.append('currentDesignation', currentExp.designation);
    if (currentExp?.company) fd.append('currentCompany', currentExp.company);
    if (experiences.some(e => e.currentlyWorking)) fd.append('currentlyEmployed', 'true');

    fd.append('skills', JSON.stringify(skills));
    fd.append('certifications', JSON.stringify(certifications));
    fd.append('technologyStack', JSON.stringify(techStack));
    fd.append('languages', JSON.stringify(languages));
    fd.append('preferredLocations', JSON.stringify(preferredLocations));
    fd.append('educationDetails', JSON.stringify(educations));
    fd.append('experienceDetails', JSON.stringify(experiences));

    if (educations[0]) {
      if (educations[0].qualification) fd.append('highestQualification', educations[0].qualification);
      if (educations[0].specialization) fd.append('specialization', educations[0].specialization);
      if (educations[0].university) fd.append('university', educations[0].university);
      if (educations[0].passingYear) fd.append('passingYear', educations[0].passingYear);
    }

    if (cvFile) fd.append('cvFile', cvFile);

    if (isEdit) updateMutation.mutate({ id: id!, fd });
    else createMutation.mutate(fd);
  };

  const updateExp = (idx: number, field: keyof Experience, val: any) => {
    setExperiences(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  };
  const addExp = () => setExperiences(prev => [...prev, { ...EMPTY_EXP }]);
  const removeExp = (idx: number) => setExperiences(prev => prev.filter((_, i) => i !== idx));

  const updateEdu = (idx: number, field: keyof Education, val: string) => {
    setEducations(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  };
  const addEdu = () => setEducations(prev => [...prev, { ...EMPTY_EDU }]);
  const removeEdu = (idx: number) => setEducations(prev => prev.filter((_, i) => i !== idx));

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cv-database')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={18} />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Candidate' : 'Add New Candidate'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">

            {/* ── Personal Details ─────────────────────────────── */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={18} className="text-primary-600" /> Personal Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name *</label>
                  <input {...register('firstName')} className="form-input" placeholder="John" />
                  {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input {...register('lastName')} className="form-input" placeholder="Doe" />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input {...register('email')} className={cn('form-input', errors.email && 'border-red-400 dark:border-red-600')}
                    type="email" placeholder="john@example.com" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <CustomSelect value={genderVal} onChange={setGenderVal} options={GENDER_OPTIONS}
                    placeholder="Select gender" displayMap={GENDER_LABELS} valueMap={GENDER_VALUES} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <PhoneInput value={phoneVal} onChange={setPhoneVal}
                    error={errors.phone?.message} />
                </div>
                <div>
                  <label className="form-label">Alternate Phone</label>
                  <PhoneInput value={altPhoneVal} onChange={setAltPhoneVal}
                    error={errors.alternatePhone?.message} />
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <DateInput value={dobVal} onChange={setDobVal} className="w-full" />
                </div>
                <div>
                  <label className="form-label">Nationality</label>
                  <input {...register('nationality')} className="form-input" placeholder="Indian" />
                </div>
                <div>
                  <label className="form-label">Religion</label>
                  <CustomSelect value={religionVal} onChange={setReligionVal}
                    options={religionOptions}
                    onAddOption={(v) => setReligionOptions(prev => [...prev, v])}
                    canAddOptions={canAddDropdownOptions}
                    placeholder="Select religion" />
                </div>
                <div>
                  <label className="form-label">Caste / Category</label>
                  <CustomSelect value={casteVal} onChange={setCasteVal}
                    options={casteOptions}
                    onAddOption={(v) => setCasteOptions(prev => [...prev, v])}
                    canAddOptions={canAddDropdownOptions}
                    placeholder="Select caste / category" />
                </div>
              </div>

              {/* Location fields */}
              <div className="mt-4">
                <label className="form-label flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary-600" /> Location
                </label>
                <div className="grid grid-cols-3 gap-3 mt-1.5">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Country</label>
                    <CustomSelect value={countryVal} onChange={handleCountryChange}
                      options={COUNTRIES} placeholder="Select country" />
                  </div>
                  {countryVal && availableStates.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">State / Region</label>
                      <CustomSelect value={stateVal} onChange={handleStateChange}
                        options={availableStates} placeholder="Select state" />
                    </div>
                  )}
                  {stateVal && availableCities.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">City</label>
                      <CustomSelect value={cityVal} onChange={setCityVal}
                        options={availableCities} placeholder="Select city" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="form-label">Current Location (freeform)</label>
                <input {...register('currentLocation')} className="form-input" placeholder="e.g. Mumbai, Maharashtra" />
              </div>

              <div className="mt-4">
                <label className="form-label">Preferred Locations</label>
                <p className="text-xs text-slate-400 mb-1.5">Type and press Enter or comma to add, or pick from suggestions</p>
                <TagInputField list={preferredLocations} onListChange={setPreferredLocations}
                  suggestions={LOCATION_SUGGESTIONS} placeholder="Add location and press Enter" />
              </div>

              <div className="mt-4">
                <label className="form-label">Languages Known</label>
                <p className="text-xs text-slate-400 mb-1.5">Type and press Enter or comma to add</p>
                <TagInputField list={languages} onListChange={setLanguages}
                  suggestions={LANG_SUGGESTIONS} placeholder="e.g. English, Hindi" />
              </div>
            </div>

            {/* ── Education ─────────────────────────────────────── */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={18} className="text-primary-600" /> Education
                </h2>
                <button type="button" onClick={addEdu} className="btn-secondary text-xs py-1.5 gap-1">
                  <Plus size={13} /> Add Education
                </button>
              </div>
              <div className="space-y-4">
                {educations.map((edu, idx) => (
                  <div key={idx} className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    {educations.length > 1 && (
                      <button type="button" onClick={() => removeEdu(idx)}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4 pr-6">
                      <div>
                        <label className="form-label text-xs">Qualification</label>
                        <CustomSelect value={edu.qualification} onChange={(v) => updateEdu(idx, 'qualification', v)}
                          options={qualificationOptions}
                          onAddOption={(v) => setQualificationOptions(prev => [...prev, v])}
                          canAddOptions={canAddDropdownOptions} placeholder="Select qualification" />
                      </div>
                      <div>
                        <label className="form-label text-xs">Specialization</label>
                        <input value={edu.specialization} onChange={(e) => updateEdu(idx, 'specialization', e.target.value)}
                          className="form-input" placeholder="Computer Science" />
                      </div>
                      <div>
                        <label className="form-label text-xs">University / College</label>
                        <input value={edu.university} onChange={(e) => updateEdu(idx, 'university', e.target.value)}
                          className="form-input" placeholder="IIT Mumbai" />
                      </div>
                      <div>
                        <label className="form-label text-xs">Passing Year</label>
                        <input type="number" value={edu.passingYear}
                          onChange={(e) => updateEdu(idx, 'passingYear', e.target.value)}
                          className="form-input" placeholder="2020" min="1950" max="2030" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Experience ────────────────────────────────────── */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-primary-600" /> Experience
                  <span className="text-xs font-normal text-slate-400">({experiences.length})</span>
                </h2>
                <button type="button" onClick={addExp} className="btn-secondary text-xs py-1.5 gap-1">
                  <Plus size={13} /> Add Experience
                </button>
              </div>

              {sortedExperiences.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No experience added yet
                </div>
              ) : (
                <div>
                  {sortedExperiences.map((exp, idx) => {
                    const originalIdx = experiences.indexOf(exp);
                    return (
                      <ExperienceCard
                        key={originalIdx}
                        exp={exp}
                        index={idx}
                        total={sortedExperiences.length}
                        onChange={(_, field, val) => updateExp(originalIdx, field, val)}
                        onRemove={() => removeExp(originalIdx)}
                        canAddDropdownOptions={canAddDropdownOptions}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Professional Details ──────────────────────────── */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Professional Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Total Experience (years)</label>
                  <input {...register('totalExperience')} type="number" step="0.5" className="form-input" placeholder="3.5" />
                </div>
                <div>
                  <label className="form-label">Source</label>
                  <CustomSelect value={sourceVal} onChange={setSourceVal} options={sourceOptions}
                    onAddOption={(v) => setSourceOptions(prev => [...prev, v])}
                    canAddOptions={canAddDropdownOptions} placeholder="Select source" />
                </div>
                <div>
                  <label className="form-label">Current CTC (₹ per year)</label>
                  <input {...register('currentCTC')} type="number" className="form-input" placeholder="600000" />
                </div>
                <div>
                  <label className="form-label">Expected CTC (₹ per year)</label>
                  <input {...register('expectedCTC')} type="number" className="form-input" placeholder="800000" />
                </div>
                <div>
                  <label className="form-label">Notice Period (days)</label>
                  <input {...register('noticePeriod')} type="number" className="form-input" placeholder="30" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Skills</label>
                  <p className="text-xs text-slate-400 mb-1.5">Type and press Enter or comma to add</p>
                  <TagInputField list={skills} onListChange={setSkills} suggestions={SKILL_SUGGESTIONS}
                    placeholder="e.g. React, JavaScript" />
                </div>
                <div>
                  <label className="form-label">Technology Stack</label>
                  <p className="text-xs text-slate-400 mb-1.5">Type and press Enter or comma to add</p>
                  <TagInputField list={techStack} onListChange={setTechStack} suggestions={TECH_SUGGESTIONS}
                    placeholder="e.g. MERN, AWS" />
                </div>
              </div>

              <div className="mt-4">
                <label className="form-label">Certifications</label>
                <p className="text-xs text-slate-400 mb-1.5">Type and press Enter or comma to add</p>
                <TagInputField list={certifications} onListChange={setCertifications}
                  suggestions={CERT_SUGGESTIONS} placeholder="e.g. AWS Certified, Google Cloud" />
              </div>
            </div>

            {/* ── Notes ─────────────────────────────────────────── */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Additional Notes</h2>
              <textarea {...register('notes')} rows={4} className="form-input resize-none"
                placeholder="Any additional notes about the candidate..." />
            </div>
          </div>

          {/* ── Sidebar ────────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Candidate Status</h3>
              <CustomSelect
                value={statusVal}
                onChange={setStatusVal}
                options={['Active', 'Inactive', 'Blacklist']}
                placeholder="Select status"
                displayMap={{ 'ACTIVE': 'Active', 'INACTIVE': 'Inactive', 'BLACKLIST': 'Blacklist' }}
                valueMap={{ 'Active': 'ACTIVE', 'Inactive': 'INACTIVE', 'Blacklist': 'BLACKLIST' }}
              />
              {statusVal === 'BLACKLIST' && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  ⚠ This candidate will be marked as blacklisted
                </p>
              )}
            </div>

            {/* CV Upload */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">CV / Resume File</h3>
              <div {...getRootProps()} className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary-400',
              )}>
                <input {...getInputProps()} />
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                {cvFile ? (
                  <div>
                    <p className="text-sm font-medium text-green-600">{cvFile.name}</p>
                    <p className="text-xs text-slate-400">{(cvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Drop CV here or <span className="text-primary-600">browse</span></p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                    {isEdit && existingData?.cvOriginalName && (
                      <p className="text-xs text-green-600 mt-2">Current: {existingData.cvOriginalName}</p>
                    )}
                  </>
                )}
              </div>
              {cvFile && (
                <button type="button" onClick={() => setCvFile(null)} className="mt-2 text-xs text-red-500 hover:underline">
                  Remove file
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button type="submit" disabled={isLoading} className="btn-primary justify-center">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {isEdit ? 'Update Candidate' : 'Save Candidate'}
              </button>
              <button type="button" onClick={() => navigate('/cv-database')} className="btn-secondary justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
