import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Key, User } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuthStore } from '../../stores/authStore';
import { employeeService } from '../../services/employeeService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import PhoneInput from '../../components/common/PhoneInput';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function ProfileView() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors }, reset: resetProfile, control: profileControl } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
  });

  const { register: regPassword, handleSubmit: handlePassword, formState: { errors: passErrors }, reset: resetPassword } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName,
        lastName: user.lastName || '',
        phone: user.phone || '',
        department: user.department || '',
        designation: user.designation || '',
        city: user.city || '',
        state: user.state || '',
      });
    }
  }, [user, resetProfile]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) {
        setPhoto(files[0]);
        setPhotoPreview(URL.createObjectURL(files[0]));
      }
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photo) fd.append('profilePhoto', photo);
      return employeeService.updateProfile(fd);
    },
    onSuccess: (res) => {
      toast.success('Profile updated');
      setUser(res.data.data ?? null);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordData) => authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => { toast.success('Password changed'); resetPassword(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const avatarSrc = photoPreview || (user?.profilePhoto ? `/uploads/${user.profilePhoto}` : null);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information and security</p>
      </div>

      {/* Profile Info */}
      <form onSubmit={handleProfile((d) => updateProfileMutation.mutate(d))}>
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <User size={18} className="text-primary-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Personal Information</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div
              {...getRootProps()}
              className="w-20 h-20 rounded-full cursor-pointer ring-2 ring-offset-2 ring-primary-300 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-700"
            >
              <input {...getInputProps()} />
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-600">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-1">Click avatar to change photo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input {...regProfile('firstName')} className="form-input" />
              {profileErrors.firstName && <p className="form-error">{profileErrors.firstName.message}</p>}
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input {...regProfile('lastName')} className="form-input" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <Controller
                name="phone"
                control={profileControl}
                render={({ field }) => (
                  <PhoneInput value={field.value || ''} onChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input {...regProfile('department')} className="form-input" />
            </div>
            <div>
              <label className="form-label">Designation</label>
              <input {...regProfile('designation')} className="form-input" />
            </div>
            <div>
              <label className="form-label">City</label>
              <input {...regProfile('city')} className="form-input" />
            </div>
            <div>
              <label className="form-label">State</label>
              <input {...regProfile('state')} className="form-input" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
              {updateProfileMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePassword((d) => changePasswordMutation.mutate(d))}>
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Key size={18} className="text-primary-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Change Password</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-md">
            <div>
              <label className="form-label">Current Password</label>
              <input {...regPassword('currentPassword')} type="password" className="form-input" />
              {passErrors.currentPassword && <p className="form-error">{passErrors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input {...regPassword('newPassword')} type="password" className="form-input" />
              {passErrors.newPassword && <p className="form-error">{passErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input {...regPassword('confirmPassword')} type="password" className="form-input" />
              {passErrors.confirmPassword && <p className="form-error">{passErrors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary">
              {changePasswordMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Key size={16} />}
              Update Password
            </button>
          </div>
        </div>
      </form>

      {/* Account Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Email</p>
            <p className="font-medium text-slate-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Role</p>
            <p className="font-medium text-slate-900 dark:text-white capitalize">{user?.role?.name?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Employee ID</p>
            <p className="font-medium font-mono text-slate-900 dark:text-white">{user?.employeeId || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Status</p>
            <span className={`badge ${user?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {user?.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
