import { useState } from 'react';
import { Globe, Check, Plus, Trash2, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function LanguageManagementView() {
  const { user } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const queryClient = useQueryClient();
  const [showAddInfo, setShowAddInfo] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const res = await settingsService.getAppSettings();
      return res.data.data;
    },
  });

  const enabledLanguages: string[] = (() => {
    try {
      return JSON.parse((settings as any)?.enabled_languages || '["en"]');
    } catch {
      return ['en'];
    }
  })();

  const updateMutation = useMutation({
    mutationFn: async (langs: string[]) => {
      const fd = new FormData();
      fd.append('enabled_languages', JSON.stringify(langs));
      return settingsService.updateSettings(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Language settings updated');
    },
  });

  const toggleLanguage = (code: string) => {
    if (code === 'en') { toast.error('English cannot be disabled'); return; }
    const next = enabledLanguages.includes(code)
      ? enabledLanguages.filter((l) => l !== code)
      : [...enabledLanguages, code];
    updateMutation.mutate(next);
  };

  if (!user?.isSuperAdmin) {
    return (
      <div className="card p-8 text-center">
        <Globe size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Language management is only available to Super Admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Language Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Control which languages are available to users. English is always enabled.
        </p>
      </div>

      {/* Current Language */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Your Language</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Select your preferred display language</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUPPORTED_LANGUAGES.filter((l) => enabledLanguages.includes(l.code)).map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                language === lang.code
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg">
                {lang.code === 'en' ? '🇬🇧' : lang.code === 'mr' ? '🇮🇳' : '🇮🇳'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lang.nativeName}</p>
                <p className="text-xs text-slate-400">{lang.name}</p>
              </div>
              {language === lang.code && <Check size={16} className="ml-auto text-primary-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Enable/Disable Languages */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Available Languages</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Toggle which languages users can choose from
        </p>
        <div className="space-y-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isEnabled = enabledLanguages.includes(lang.code);
            const isDefault = lang.code === 'en';
            return (
              <div
                key={lang.code}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.code === 'en' ? '🇬🇧' : '🇮🇳'}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{lang.nativeName}</p>
                    <p className="text-xs text-slate-400">{lang.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isDefault && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Default</span>
                  )}
                  <button
                    onClick={() => toggleLanguage(lang.code)}
                    disabled={isDefault || updateMutation.isPending}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative',
                      isEnabled ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600',
                      (isDefault || updateMutation.isPending) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform',
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Language Info */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add New Language</h3>
          <button
            onClick={() => setShowAddInfo(!showAddInfo)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"
          >
            <Info size={16} />
          </button>
        </div>

        {showAddInfo ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">Developer Instructions</p>
            <p className="text-blue-700 dark:text-blue-400 mb-3 text-xs">To add a new language to the system:</p>
            <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5 list-decimal list-inside">
              <li>Create a new locale file: <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">src/i18n/locales/[lang-code].ts</code></li>
              <li>Copy the structure from <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">en.ts</code> and translate all strings</li>
              <li>Import it in <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">src/i18n/index.ts</code> and add to resources</li>
              <li>Add the language to <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">SUPPORTED_LANGUAGES</code> array in <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">index.ts</code></li>
              <li>Enable it here via the toggle above</li>
            </ol>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
            <Plus size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Adding new languages requires a code deployment.</p>
            <button
              onClick={() => setShowAddInfo(true)}
              className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              View developer instructions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
