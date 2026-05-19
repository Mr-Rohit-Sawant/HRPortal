import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { useAuthStore } from '../../stores/authStore';
import BusinessSelector from '../../components/common/BusinessSelector';
import toast from 'react-hot-toast';
import SmartSelect from '../../components/common/SmartSelect';
import PhoneInput from '../../components/common/PhoneInput';
import { COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE, toOptions } from '../../data/locationData';

const schema = z.object({
  companyName: z.string().min(1, 'Company name required'),
  contactPerson: z.string().min(1, 'Contact person required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone required'),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddClientView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSuperAdmin ?? false;
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [extraCountries, setExtraCountries] = useState<string[]>([]);
  const [extraStates, setExtraStates] = useState<string[]>([]);
  const [extraCities, setExtraCities] = useState<string[]>([]);

  const { data: existing } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => { const res = await clientService.getClientById(id!); return res.data.data; },
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'India', state: 'Maharashtra', city: 'Mumbai' },
  });

  const selectedCountry = watch('country');
  const selectedState = watch('state');

  useEffect(() => {
    if (existing) {
      reset({
        companyName: existing.companyName,
        contactPerson: existing.contactPerson,
        email: existing.email,
        phone: existing.phone,
        alternatePhone: existing.alternatePhone || '',
        address: existing.address || '',
        city: existing.city || 'Mumbai',
        state: existing.state || 'Maharashtra',
        country: existing.country || 'India',
        pincode: existing.pincode || '',
        gstNumber: existing.gstNumber || '',
        panNumber: existing.panNumber || '',
        industry: existing.industry || '',
        website: existing.website || '',
        contractStartDate: existing.contractStartDate?.split('T')[0] || '',
        contractEndDate: existing.contractEndDate?.split('T')[0] || '',
        notes: existing.notes || '',
      });
      if (existing.businessId) setSelectedBusinessId(existing.businessId);
    }
  }, [existing, reset]);

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

  const createMutation = useMutation({
    mutationFn: clientService.createClient,
    onSuccess: () => { toast.success('Client created'); queryClient.invalidateQueries({ queryKey: ['clients'] }); navigate('/clients'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<FormData>) => clientService.updateClient(id!, data),
    onSuccess: () => { toast.success('Client updated'); queryClient.invalidateQueries({ queryKey: ['clients'] }); navigate('/clients'); },
  });

  const onSubmit = (data: FormData) => {
    const payload: any = isSuperAdmin && selectedBusinessId ? { ...data, businessId: selectedBusinessId } : data;
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
        <button onClick={() => navigate('/clients')} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={18} />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Client' : 'Add Client'}</h1>
      </div>

      {isSuperAdmin && (
        <BusinessSelector value={selectedBusinessId} onChange={setSelectedBusinessId} className="mb-6 max-w-3xl" />
      )}

      {(!isSuperAdmin || selectedBusinessId) && (
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Company Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-full sm:col-span-2">
              <label className="form-label">Company Name *</label>
              <input {...register('companyName')} className="form-input" />
              {errors.companyName && <p className="form-error">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="form-label">Contact Person *</label>
              <input {...register('contactPerson')} className="form-input" />
              {errors.contactPerson && <p className="form-error">{errors.contactPerson.message}</p>}
            </div>
            <div>
              <label className="form-label">Industry</label>
              <input {...register('industry')} className="form-input" placeholder="IT, Finance, Healthcare..." />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input {...register('email')} type="email" className="form-input" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="form-label">Phone *</label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput value={field.value || ''} onChange={field.onChange} error={errors.phone?.message} />
                )}
              />
            </div>
            <div>
              <label className="form-label">Alternate Phone</label>
              <Controller
                name="alternatePhone"
                control={control}
                render={({ field }) => (
                  <PhoneInput value={field.value || ''} onChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <label className="form-label">Website</label>
              <input {...register('website')} className="form-input" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Address & Tax</h2>
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
            <div>
              <label className="form-label">Pincode</label>
              <input {...register('pincode')} className="form-input" />
            </div>
            <div>
              <label className="form-label">GST Number</label>
              <input {...register('gstNumber')} className="form-input" placeholder="27AAAAA0000A1Z5" />
            </div>
            <div>
              <label className="form-label">PAN Number</label>
              <input {...register('panNumber')} className="form-input" placeholder="AAAAA0000A" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Contract Period</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contract Start Date</label>
              <input {...register('contractStartDate')} type="date" className="form-input" />
            </div>
            <div>
              <label className="form-label">Contract End Date</label>
              <input {...register('contractEndDate')} type="date" className="form-input" />
            </div>
            <div className="col-span-full sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea {...register('notes')} rows={3} className="form-input resize-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            {isEdit ? 'Update Client' : 'Add Client'}
          </button>
          <button type="button" onClick={() => navigate('/clients')} className="btn-secondary">Cancel</button>
        </div>
      </form>
      )}
    </div>
  );
}
