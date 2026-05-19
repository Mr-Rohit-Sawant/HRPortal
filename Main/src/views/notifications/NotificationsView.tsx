import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Bell, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CreateNotificationModal from './CreateNotificationModal';

interface UserNotification {
  id: string;
  title: string;
  description: string;
  sendTo: string | string[];
  files?: { name: string; path: string; size: number }[];
  clientId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; firstName: string; lastName: string };
  client?: { id: string; companyName: string } | null;
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export default function NotificationsView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [type, setType] = useState<'all' | 'received' | 'sent'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserNotification | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['user-notifications', { page, limit, type }],
    queryFn: async () => {
      const res = await notificationService.getAll({ page, limit, type });
      return res.data as { data: UserNotification[]; meta: Meta };
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      toast.success('Notification deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete notification'),
  });

  const notifications = data?.data ?? [];
  const meta = data?.meta;

  const formatSendTo = (sendTo: string | string[]) => {
    if (sendTo === 'ALL' || sendTo === '"ALL"') return (
      <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">All</span>
    );
    let arr: string[] = [];
    if (typeof sendTo === 'string') {
      try { arr = JSON.parse(sendTo); } catch { arr = []; }
    } else {
      arr = sendTo;
    }
    if (!Array.isArray(arr)) return <span className="badge">—</span>;
    return (
      <span className="badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
        {arr.length} {arr.length === 1 ? 'employee' : 'employees'}
      </span>
    );
  };

  const isReadByMe = (notif: UserNotification) => {
    if (!user?.id) return true;
    let readBy: string[] = [];
    try {
      const raw = (notif as any).readBy;
      readBy = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    } catch { readBy = []; }
    return readBy.includes(user.id);
  };

  const canDelete = (notif: UserNotification) => {
    return notif.createdById === user?.id || user?.isSuperAdmin;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage and send notifications to employees</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Create Notification
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {(['all', 'received', 'sent'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              type === t
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Bell size={40} className="opacity-30" />
            <p className="text-sm">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-1/4">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-1/3">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Send To</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Created By</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {notifications.map((notif) => {
                  const read = isReadByMe(notif);
                  return (
                  <tr
                    key={notif.id}
                    onClick={() => !read && markReadMutation.mutate(notif.id)}
                    className={`transition-colors ${!read ? 'bg-primary-50 dark:bg-primary-900/20 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/20'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                        <div className="font-medium text-slate-900 dark:text-white">{notif.title}</div>
                      </div>
                      {notif.client && (
                        <div className="text-xs text-slate-400 mt-0.5">{notif.client.companyName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs">
                      <p className="line-clamp-2">{notif.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      {formatSendTo(notif.sendTo)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {notif.createdBy.firstName} {notif.createdBy.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(notif.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete(notif) && (
                        <button
                          onClick={() => setDeleteTarget(notif)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateNotificationModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Notification"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
