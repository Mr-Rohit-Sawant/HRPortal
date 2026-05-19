import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, User, Eye, EyeOff, RefreshCw, KeyRound } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { employeeService } from '../../services/employeeService';
import { settingsService } from '../../services/settingsService';
import { useAuthStore } from '../../stores/authStore';
import BusinessSelector from '../../components/common/BusinessSelector';
import ResetPasswordModal from '../../components/employees/ResetPasswordModal';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import SmartSelect, { SmartSelectOption } from '../../components/common/SmartSelect';
import PhoneInput from '../../components/common/PhoneInput';
import { COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE, toOptions } from '../../data/locationData';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().optional(),
  email: z.string().email('Valid email required'),
  username: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  roleId: z.string().min(1, 'Role is required'),
  joiningDate: z.string().optional(),
  salary: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  sendWelcome: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddEmployeeView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.isSuperAdmin ?? false;
  const canResetPassword = isSuperAdmin || currentUser?.role?.name === 'admin';
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [extraCountries, setExtraCountries] = useState<string[]>([]);
  const [extraStates, setExtraStates] = useState<string[]>([]);
  const [extraCities, setExtraCities] = useState<string[]>([]);
  const [autoPassword, setAutoPassword] = useState(true);
  const [generatedPwd, setGeneratedPwd] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => { const res = await settingsService.getRoles(); return res.data.data || []; },
  });

  const { data: existingEmployee } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => { const res = await employeeService.getEmployeeById(id!); return res.data.data; },
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'India', state: 'Maharashtra', city: 'Mumbai', sendWelcome: true },
  });

  const selectedCountry = watch('country');
  const selectedState = watch('state');

  useEffect(() => {
    if (existingEmployee) {
      reset({
        firstName: existingEmployee.firstName,
        lastName: existingEmployee.lastName || '',
        email: existingEmployee.email,
        phone: existingEmployee.phone || '',
        department: existingEmployee.department || '',
        designation: existingEmployee.designation || '',
        roleId: existingEmployee.roleId,
        joiningDate: existingEmployee.joiningDate?.split('T')[0] || '',
        salary: existingEmployee.salary?.toString() || '',
        city: existingEmployee.city || 'Mumbai',
        state: existingEmployee.state || 'Maharashtra',
        country: existingEmployee.country || 'India',
      });
      if (existingEmployee.businessId) setSelectedBusinessId(existingEmployee.businessId);
    }
  }, [existingEmployee, reset]);

  // Reset state when country changes (only if country actually changed)
  const prevCountryRef = useState(selectedCountry)[0];
  useEffect(() => {
    if (prevCountryRef !== selectedCountry) {
      setValue('state', '');
      setValue('city', '');
    }
  }, [selectedCountry]);

  useEffect(() => {
    setValue('city', '');
  }, [selectedState]);

  const makePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const syms = '@#$!';
    const pool = upper + lower + nums + syms;
    let pwd = upper[Math.floor(Math.random() * upper.length)]
      + lower[Math.floor(Math.random() * lower.length)]
      + nums[Math.floor(Math.random() * nums.length)]
      + syms[Math.floor(Math.random() * syms.length)];
    for (let i = 4; i < 10; i++) pwd += pool[Math.floor(Math.random() * pool.length)];
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  };

  useEffect(() => {
    if (!isEdit) setGeneratedPwd(makePassword());
  }, [isEdit]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (f) => { if (f[0]) setPhoto(f[0]); },
  });

  const createMutation = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => { toast.success('Employee created'); queryClient.invalidateQueries({ queryKey: ['employees'] }); navigate('/employees'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => employeeService.updateEmployee(id, fd as any),
    onSuccess: () => { toast.success('Employee updated'); queryClient.invalidateQueries({ queryKey: ['employees'] }); navigate('/employees'); },
  });

  const onSubmit = (data: FormData) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, String(v)); });
    if (photo) fd.append('profilePhoto', photo);
    if (!isEdit) {
      const finalPwd = autoPassword ? generatedPwd : customPassword;
      if (finalPwd) fd.append('password', finalPwd);
    }
    if (isSuperAdmin && selectedBusinessId) fd.append('businessId', selectedBusinessId);

    if (isEdit) updateMutation.mutate({ id: id!, fd: fd as any });
    else createMutation.mutate(fd);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const roleOptions: SmartSelectOption[] = (rolesData || []).map((r: any) => ({
    value: r.id,
    label: r.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
  }));

  const allCountries = [...COUNTRIES, ...extraCountries];
  const statesForCountry = [
    ...(STATES_BY_COUNTRY[selectedCountry || ''] || []),
    ...extraStates,
  ];
  const citiesForState = [
    ...(CITIES_BY_STATE[selectedState || ''] || []),
    ...extraCities,
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/employees')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={18} />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>
      </div>

      {isSuperAdmin && (
        <BusinessSelector value={selectedBusinessId} onChange={setSelectedBusinessId} className="mb-6" />
      )}

      {(!isSuperAdmin || selectedBusinessId) && (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name *</label>
                  <input {...register('firstName')} className="form-input" />
                  {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input {...register('lastName')} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input {...register('email')} type="email" className="form-input" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="form-label">Username</label>
                  <input {...register('username')} className="form-input" placeholder="Auto-generated if empty" />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput value={field.value || ''} onChange={field.onChange} />
                    )}
                  />
                </div>
                <div>
                  <label className="form-label">Joining Date</label>
                  <input {...register('joiningDate')} type="date" className="form-input" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Work Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Department</label>
                  <input {...register('department')} className="form-input" placeholder="HR, Tech, Sales..." />
                </div>
                <div>
                  <label className="form-label">Designation</label>
                  <input {...register('designation')} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Role *</label>
                  <Controller
                    name="roleId"
                    control={control}
                    render={({ field }) => (
                      <SmartSelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={roleOptions}
                        placeholder="Select role"
                        error={!!errors.roleId}
                      />
                    )}
                  />
                  {errors.roleId && <p className="form-error">{errors.roleId.message}</p>}
                </div>
                <div>
                  <label className="form-label">Salary (₹/month)</label>
                  <input {...register('salary')} type="number" className="form-input" />
                </div>
              </div>
            </div>

            {!isEdit && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900 dark:text-white">Login Password</h2>
                  <button
                    type="button"
                    onClick={() => setAutoPassword((v) => !v)}
                    className={cn(
                      'flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors',
                      autoPassword
                        ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400',
                    )}
                  >
                    <div className={cn('w-8 h-4.5 rounded-full relative transition-colors', autoPassword ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600')}
                      style={{ height: '18px' }}>
                      <div className={cn('absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform', autoPassword ? 'left-auto right-0.5' : 'left-0.5')} />
                    </div>
                    {autoPassword ? 'Auto-generate' : 'Set manually'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={autoPassword ? generatedPwd : customPassword}
                    readOnly={autoPassword}
                    onChange={autoPassword ? undefined : (e) => setCustomPassword(e.target.value)}
                    placeholder={autoPassword ? '' : 'Enter a password...'}
                    className={cn('form-input pr-20 font-mono', autoPassword && 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300')}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {autoPassword && (
                      <button
                        type="button"
                        title="Regenerate password"
                        onClick={() => setGeneratedPwd(makePassword())}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <RefreshCw size={13} className="text-slate-400" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      {showPassword ? <EyeOff size={13} className="text-slate-400" /> : <Eye size={13} className="text-slate-400" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {autoPassword
                    ? 'Password is auto-generated. Click the refresh icon to get a new one.'
                    : 'Employee will use this password to log in.'}
                </p>
              </div>
            )}

            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full sm:col-span-2">
                  <label className="form-label">Address</label>
                  <textarea {...register('address')} rows={2} className="form-input resize-none" />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <SmartSelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={toOptions(allCountries)}
                        placeholder="Select country"
                        canAddNew
                        onAddNew={(label) => { setExtraCountries((p) => [...p, label]); return { value: label, label }; }}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <SmartSelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={toOptions(statesForCountry)}
                        placeholder={statesForCountry.length ? 'Select state' : 'Select country first'}
                        disabled={!selectedCountry}
                        canAddNew
                        onAddNew={(label) => { setExtraStates((p) => [...p, label]); return { value: label, label }; }}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <SmartSelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={toOptions(citiesForState)}
                        placeholder={citiesForState.length ? 'Select city' : selectedState ? 'Type to add city' : 'Select state first'}
                        disabled={!selectedState}
                        canAddNew
                        onAddNew={(label) => { setExtraCities((p) => [...p, label]); return { value: label, label }; }}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Profile Photo</h3>
              <div {...getRootProps()} className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors">
                <input {...getInputProps()} />
                {photo ? (
                  <div>
                    <img src={URL.createObjectURL(photo)} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
                    <p className="text-xs text-green-600">{photo.name}</p>
                  </div>
                ) : existingEmployee?.profilePhoto ? (
                  <div>
                    <img src={`/uploads/${existingEmployee.profilePhoto}`} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <User size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">Upload profile photo</p>
                    <p className="text-xs text-slate-400">JPG, PNG up to 2MB</p>
                  </div>
                )}
              </div>
            </div>

            {!isEdit && (
              <div className="card p-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('sendWelcome')} type="checkbox" className="w-4 h-4 rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Send welcome email with credentials</span>
                </label>
              </div>
            )}

            {isEdit && canResetPassword && (
              <div className="card p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <KeyRound size={15} className="text-amber-500" /> Reset Password
                </h3>
                <p className="text-xs text-slate-400 mb-3">Set a new password for this employee's account.</p>
                <button
                  type="button"
                  onClick={() => setResetPwOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <KeyRound size={14} /> Reset Password
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button type="submit" disabled={isLoading} className="btn-primary justify-center">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {isEdit ? 'Update Employee' : 'Add Employee'}
              </button>
              <button type="button" onClick={() => navigate('/employees')} className="btn-secondary justify-center">Cancel</button>
            </div>
          </div>
        </div>
      </form>
      )}

      {isEdit && existingEmployee && (
        <ResetPasswordModal
          isOpen={resetPwOpen}
          onClose={() => setResetPwOpen(false)}
          employeeId={id!}
          employeeName={`${existingEmployee.firstName} ${existingEmployee.lastName || ''}`}
        />
      )}
    </div>
  );
}
