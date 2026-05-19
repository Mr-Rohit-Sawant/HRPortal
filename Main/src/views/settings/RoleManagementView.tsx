import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Copy, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../stores/authStore';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
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
interface Role { id: string; name: string; isSystem: boolean; permissions: { permission: Permission }[] | undefined; }

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
  manage_roles: 'Manage Roles', view_contacts: 'View Contact Details',
};

export default function RoleManagementView() {
  const queryClient = useQueryClient();
  const { user, canAccess } = useAuthStore();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const canManageRoles = isSuperAdmin || canAccess('settings:manage_roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(Object.keys(MODULE_LABELS)));
  const [notifEditDelay, setNotifEditDelay] = useState('never_expire');
  const [notifDeleteDelay, setNotifDeleteDelay] = useState('never_expire');

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

  const roles: Role[] = (rolesData || []) as unknown as Role[];
  const permissions: Permission[] = permsData || [];

  const permsByModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
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
    mutationFn: () => settingsService.createRole({ name: newRoleName, permissionIds: Array.from(selectedPermIds) }),
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
        {canManageRoles && (
          <button onClick={() => openEdit()} className="btn-primary">
            <Plus size={16} /> Create Role
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Shield size={18} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                    {role.name.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-slate-500">{(role.permissions || []).length} permissions</p>
                </div>
              </div>
              {role.isSystem && (
                <span className="badge bg-blue-100 text-blue-700 text-xs">System</span>
              )}
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
              {(!role.isSystem || isSuperAdmin) && canManageRoles && (
                <button onClick={() => openEdit(role)} className="btn-secondary flex-1 py-1.5 text-xs justify-center">
                  <Edit size={13} /> Edit
                </button>
              )}
              <button onClick={() => cloneMutation.mutate(role.id)} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Clone">
                <Copy size={14} />
              </button>
              {(!role.isSystem || isSuperAdmin) && canManageRoles && (
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
                      <div className="grid grid-cols-2 gap-1 px-4 py-2">
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
                <div className="grid grid-cols-2 gap-4 px-4 py-3">
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
