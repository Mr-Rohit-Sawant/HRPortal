import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Copy, Shield, ChevronDown, ChevronRight, Globe, Building2 } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../stores/authStore';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import BusinessSearchSelect from '../../components/common/BusinessSearchSelect';
import toast from 'react-hot-toast';

const DELAY_OPTIONS = [
  { value: 'never_expire', label: 'Never Expire' },
  { value: 'not_allowed', label: 'Not Allowed' },
  { value: '1h', label: '1 Hour' },
  { value: '8h', label: '8 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

interface Permission { id: string; module: string; action: string; }
interface Role { id: string; name: string; isSystem: boolean; isActive: boolean; businessId?: string | null; permissions: { permission: Permission }[] | undefined; }

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', cv: 'CV Database', jobs: 'Job Openings',
  employees: 'Employees', clients: 'Clients', invoices: 'Invoices',
  settings: 'Settings', reports: 'Reports', audit: 'Audit Logs',
  columns: 'Column Management', dropdown: 'Dropdown Options',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'View', create: 'Create', update: 'Edit', delete: 'Delete',
  bulk_import: 'Bulk Import', download: 'Download', toggle_status: 'Toggle Status',
  send_email: 'Send Email', theme: 'Manage Theme', roles: 'Manage Roles',
  fonts: 'Manage Fonts', manage: 'Manage Columns', manage_options: 'Manage Dropdown Options',
  manage_roles: 'Manage Roles (Full)', view_contacts: 'View Contact Details',
  roles_view: 'View Roles', roles_create: 'Create Roles',
  roles_edit: 'Edit Roles', roles_delete: 'Delete Roles',
  language: 'Language Management',
};

export default function RoleManagementView() {
  const queryClient = useQueryClient();
  const { user, canAccess } = useAuthStore();
  const isSuperAdmin = !!user?.isSuperAdmin;
  // support both old key (settings:roles) and new key (settings:manage_roles)
  const canManageRoles = isSuperAdmin || canAccess('settings:manage_roles') || canAccess('settings:roles');
  const canViewRoles = isSuperAdmin || canManageRoles || canAccess('settings:roles_view');
  const canCreateRoles = isSuperAdmin || canManageRoles || canAccess('settings:roles_create');
  const canEditRoles = isSuperAdmin || canManageRoles || canAccess('settings:roles_edit');
  const canDeleteRoles = isSuperAdmin || canManageRoles || canAccess('settings:roles_delete');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [scopeBusinessId, setScopeBusinessId] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(Object.keys(MODULE_LABELS)));
  const [notifEditDelay, setNotifEditDelay] = useState('never_expire');
  const [notifDeleteDelay, setNotifDeleteDelay] = useState('never_expire');

  // Show business scope for super admin AND users not linked to any business
  const showBusinessScope = isSuperAdmin || !user?.businessId;

  // A business-linked user can only edit roles belonging to their own business (not global roles)
  const canEditRole = (role: Role) => {
    if (isSuperAdmin) return true;
    if (role.isSystem) return false; // system roles: super admin only
    if (!role.businessId) return !user?.businessId; // global custom roles: only unlinked users
    return role.businessId === user?.businessId; // business roles: only same business
  };

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => { const res = await settingsService.getRoles(); return res.data.data || []; },
  });

  const { data: permsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => { const res = await settingsService.getPermissions(); return res.data.data || []; },
  });

  const { data: notifPermsData } = useQuery({
    queryKey: ['notification-permissions'],
    queryFn: async () => { const res = await notificationService.getPermissions(); return (res.data as any).data; },
  });

  // Super Admin role is hidden from non-super-admins everywhere
  const roles: Role[] = ((rolesData || []) as unknown as Role[])
    .filter((r) => isSuperAdmin || r.name !== 'super_admin');
  const permissions: Permission[] = permsData || [];

  // Only show permissions that the logged-in user themselves possess (super admin sees all)
  const visiblePermissions = isSuperAdmin
    ? permissions
    : permissions.filter((p) => user?.permissions?.includes(`${p.module}:${p.action}`));

  const permsByModule = visiblePermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  // Initialise delay dropdowns when opening edit for a specific role
  useEffect(() => {
    if (!editModal || !selectedRole || !notifPermsData) return;
    const roleName = selectedRole.name;
    setNotifEditDelay((notifPermsData?.edit?.delays as Record<string, string>)?.[roleName] ?? 'never_expire');
    setNotifDeleteDelay((notifPermsData?.delete?.delays as Record<string, string>)?.[roleName] ?? 'never_expire');
  }, [editModal, selectedRole, notifPermsData]);

  const openEdit = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setNewRoleName(role.name);
      setSelectedPermIds(new Set((role.permissions || []).map((rp) => rp.permission.id)));
    } else {
      setSelectedRole(null);
      setNewRoleName('');
      setSelectedPermIds(new Set());
      setScopeBusinessId('');
      setNotifEditDelay('never_expire');
      setNotifDeleteDelay('never_expire');
    }
    setEditModal(true);
  };

  const saveNotifDelays = async (roleName: string) => {
    if (!isSuperAdmin) return;
    const current = notifPermsData ?? { edit: { delays: {} }, delete: { delays: {} } };
    const updated = {
      ...current,
      edit: { delays: { ...(current.edit?.delays ?? {}), [roleName]: notifEditDelay } },
      delete: { delays: { ...(current.delete?.delays ?? {}), [roleName]: notifDeleteDelay } },
    };
    await notificationService.updatePermissions(updated);
    queryClient.invalidateQueries({ queryKey: ['notification-permissions'] });
  };

  const createMutation = useMutation({
    mutationFn: () => settingsService.createRole({
      name: newRoleName,
      permissionIds: Array.from(selectedPermIds),
      ...(showBusinessScope && scopeBusinessId ? { businessId: scopeBusinessId } : {}),
    }),
    onSuccess: () => { toast.success('Role created'); queryClient.invalidateQueries({ queryKey: ['roles'] }); setEditModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await settingsService.updateRole(selectedRole!.id, { name: newRoleName, permissionIds: Array.from(selectedPermIds) });
      await saveNotifDelays(newRoleName);
    },
    onSuccess: () => { toast.success('Role updated'); queryClient.invalidateQueries({ queryKey: ['roles'] }); setEditModal(false); },
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => settingsService.cloneRole(id),
    onSuccess: () => { toast.success('Role cloned'); queryClient.invalidateQueries({ queryKey: ['roles'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => settingsService.toggleRole(id),
    onSuccess: (res) => {
      const active = (res.data.data as any)?.isActive;
      toast.success(active ? 'Role enabled' : 'Role disabled');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsService.deleteRole(id),
    onSuccess: () => { toast.success('Role deleted'); queryClient.invalidateQueries({ queryKey: ['roles'] }); setDeleteId(null); },
  });

  const togglePerm = (id: string) => {
    const s = new Set(selectedPermIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedPermIds(s);
  };

  const toggleModule = (module: string, modulePerms: Permission[]) => {
    const s = new Set(selectedPermIds);
    const allSelected = modulePerms.every((p) => s.has(p.id));
    modulePerms.forEach((p) => allSelected ? s.delete(p.id) : s.add(p.id));
    setSelectedPermIds(s);
  };

  const toggleModuleExpand = (m: string) => {
    const s = new Set(expandedModules);
    s.has(m) ? s.delete(m) : s.add(m);
    setExpandedModules(s);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{roles.length} roles defined</p>
        </div>
        {canCreateRoles && (
          <button onClick={() => openEdit()} className="btn-primary">
            <Plus size={16} /> Create Role
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className={`card p-5 transition-opacity ${!role.isActive && !role.isSystem ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.isActive || role.isSystem ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Shield size={18} className={role.isActive || role.isSystem ? 'text-primary-600' : 'text-slate-400'} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                    {role.name.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-slate-500">{(role.permissions || []).length} permissions</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {role.isSystem
                  ? <span className="badge bg-blue-100 text-blue-700 text-xs">System</span>
                  : <>
                      {role.isActive
                        ? <span className="badge bg-emerald-100 text-emerald-700 text-xs">Enabled</span>
                        : <span className="badge bg-slate-100 text-slate-500 text-xs">Disabled</span>
                      }
                      {role.businessId
                        ? <span className="badge bg-amber-100 text-amber-700 text-xs flex items-center gap-1"><Building2 size={10} />Business</span>
                        : <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1"><Globe size={10} />Global</span>
                      }
                    </>
                }
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4 min-h-8">
              {Object.keys(MODULE_LABELS).filter((m) =>
                (role.permissions || []).some((rp) => rp.permission.module === m)
              ).map((m) => (
                <span key={m} className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                  {MODULE_LABELS[m]}
                </span>
              ))}
            </div>

            <div className="flex gap-1.5">
              {canEditRoles && canEditRole(role) && (
                <button onClick={() => openEdit(role)} className="btn-secondary flex-1 py-1.5 text-xs justify-center">
                  <Edit size={13} /> Edit
                </button>
              )}
              {/* Enable / Disable toggle — system roles cannot be toggled */}
              {!role.isSystem && canEditRole(role) && (
                <button
                  onClick={() => toggleMutation.mutate(role.id)}
                  disabled={toggleMutation.isPending}
                  title={role.isActive ? 'Disable role' : 'Enable role'}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                    role.isActive
                      ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600'
                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600'
                  }`}
                >
                  {role.isActive ? 'Disable' : 'Enable'}
                </button>
              )}
              {canViewRoles && (
                <button onClick={() => cloneMutation.mutate(role.id)} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Clone">
                  <Copy size={14} />
                </button>
              )}
              {canDeleteRoles && canEditRole(role) && (
                <button onClick={() => setDeleteId(role.id)} className="px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title={selectedRole ? 'Edit Role' : 'Create New Role'}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => selectedRole ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!newRoleName || createMutation.isPending || updateMutation.isPending}
              className="btn-primary"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : selectedRole ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="form-label">Role Name</label>
            <input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="form-input"
              placeholder="e.g. Senior Recruiter"
              disabled={!!(selectedRole?.isSystem && !isSuperAdmin)}
            />
          </div>

          {/* Business scope — shown only when creating a new role as an unlinked user */}
          {showBusinessScope && !selectedRole && (
            <div>
              <label className="form-label flex items-center gap-1.5">
                <Building2 size={14} /> Business Scope
                <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <BusinessSearchSelect
                value={scopeBusinessId}
                onChange={setScopeBusinessId}
                placeholder="— Leave empty for global (visible to all) —"
              />
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                {scopeBusinessId
                  ? <><Building2 size={11} className="text-primary-500" /> This role will only be visible to the selected business</>
                  : <><Globe size={11} /> No business selected — role will be visible to all businesses</>
                }
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0">Permissions</label>
              <span className="text-xs text-slate-500">{selectedPermIds.size} selected</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {Object.entries(permsByModule).map(([module, modulePerms]) => {
                const allSelected = modulePerms.every((p) => selectedPermIds.has(p.id));
                const someSelected = modulePerms.some((p) => selectedPermIds.has(p.id));
                const isExpanded = expandedModules.has(module);
                return (
                  <div key={module} className="border-b last:border-b-0 border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                        onChange={() => toggleModule(module, modulePerms)}
                        className="w-4 h-4 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => toggleModuleExpand(module)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {MODULE_LABELS[module] || module}
                        </span>
                        <span className="text-xs text-slate-400">({modulePerms.length})</span>
                        {isExpanded ? <ChevronDown size={14} className="ml-auto text-slate-400" /> : <ChevronRight size={14} className="ml-auto text-slate-400" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-4 py-2">
                        {modulePerms.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={selectedPermIds.has(p.id)}
                              onChange={() => togglePerm(p.id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{ACTION_LABELS[p.action] || p.action}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notification Delay Settings */}
          {isSuperAdmin && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="form-label mb-0">Notification Permissions</label>
                <span className="text-xs text-slate-400">Edit / Delete delay per role</span>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Edit Delay</label>
                    <select
                      value={notifEditDelay}
                      onChange={e => setNotifEditDelay(e.target.value)}
                      className="form-input text-sm py-1.5"
                    >
                      {DELAY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Delete Delay</label>
                    <select
                      value={notifDeleteDelay}
                      onChange={e => setNotifDeleteDelay(e.target.value)}
                      className="form-input text-sm py-1.5"
                    >
                      {DELAY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="px-4 pb-3 text-xs text-slate-400">
                  "Never Expire" = always allowed · "Not Allowed" = permission denied · time values = edit/delete window after creation
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Role"
        message="Are you sure? Users assigned this role will lose their permissions."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
