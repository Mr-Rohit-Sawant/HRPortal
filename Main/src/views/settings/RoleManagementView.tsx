import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Copy, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useAuthStore } from '../../stores/authStore';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

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
  manage_roles: 'Manage Roles',
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

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => { const res = await settingsService.getRoles(); return res.data.data || []; },
  });

  const { data: permsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => { const res = await settingsService.getPermissions(); return res.data.data || []; },
  });

  const roles: Role[] = (rolesData || []) as unknown as Role[];
  const permissions: Permission[] = permsData || [];

  const permsByModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const openEdit = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setNewRoleName(role.name);
      setSelectedPermIds(new Set((role.permissions || []).map((rp) => rp.permission.id)));
    } else {
      setSelectedRole(null);
      setNewRoleName('');
      setSelectedPermIds(new Set());
    }
    setEditModal(true);
  };

  const createMutation = useMutation({
    mutationFn: () => settingsService.createRole({ name: newRoleName, permissionIds: Array.from(selectedPermIds) }),
    onSuccess: () => { toast.success('Role created'); queryClient.invalidateQueries({ queryKey: ['roles'] }); setEditModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: () => settingsService.updateRole(selectedRole!.id, { name: newRoleName, permissionIds: Array.from(selectedPermIds) }),
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
