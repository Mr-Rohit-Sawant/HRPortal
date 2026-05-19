import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, Upload, Palette, Type, Globe } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { settingsService } from '../../services/settingsService';
import toast from 'react-hot-toast';

const PRESET_PALETTES = [
  { name: 'Ocean Blue', primary: '#1E40AF', sidebar: '#0F172A' },
  { name: 'Forest Green', primary: '#15803D', sidebar: '#14532D' },
  { name: 'Royal Purple', primary: '#6D28D9', sidebar: '#1E1B4B' },
  { name: 'Sunset Red', primary: '#B91C1C', sidebar: '#1C0A0A' },
  { name: 'Teal', primary: '#0F766E', sidebar: '#042F2E' },
  { name: 'Slate', primary: '#475569', sidebar: '#0F172A' },
];

export default function ThemeManagementView() {
  const { isDark, primaryColor: storePrimary, sidebarColor: storeSidebar, fontFamily, appName, appLogo, appFavicon, setTheme, toggleDark } = useThemeStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(storePrimary || '#1E40AF');
  const [sidebarColor, setSidebarColor] = useState(storeSidebar || '#0F172A');
  const [nameValue, setNameValue] = useState(appName || 'HR Suite');
  const [selectedFont, setSelectedFont] = useState(fontFamily || 'Inter');

  const { register, handleSubmit } = useForm({
    defaultValues: { appName: appName || 'HR Suite' },
  });

  const { data: settingsData } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => { const res = await settingsService.getSettings(); return res.data.data; },
  });

  const { getRootProps: getLogoProps, getInputProps: getLogoInput } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) {
        setLogoFile(files[0]);
        setLogoPreview(URL.createObjectURL(files[0]));
      }
    },
  });

  const { getRootProps: getFaviconProps, getInputProps: getFaviconInput } = useDropzone({
    accept: { 'image/*': [], 'image/x-icon': ['.ico'] },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) {
        setFaviconFile(files[0]);
        setFaviconPreview(URL.createObjectURL(files[0]));
      }
    },
  });

  const uploadFaviconMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('favicon', file);
      return settingsService.uploadFavicon(fd);
    },
    onSuccess: (res) => {
      const faviconPath = res.data.data?.faviconPath;
      if (faviconPath) setTheme({ appFavicon: faviconPath });
      setFaviconFile(null);
      toast.success('Favicon updated — visible in browser tab');
    },
    onError: () => toast.error('Favicon upload failed'),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('appName', nameValue);
      fd.append('primaryColor', primaryColor);
      fd.append('sidebarColor', sidebarColor);
      fd.append('fontFamily', selectedFont);
      if (logoFile) fd.append('logo', logoFile);
      return settingsService.updateSettings(fd);
    },
    onSuccess: (res) => {
      const s = res.data.data;
      if (s) {
        setTheme({
          appName: s.appName,
          appLogo: s.logo,
          primaryColor: s.primaryColor,
          sidebarColor: s.sidebarColor,
          fontFamily: s.fontFamily,
        });
      }
      toast.success('Theme saved and applied');
    },
  });

  const FONT_OPTIONS = [
    { label: 'Inter (Default)', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Open Sans', value: 'Open Sans' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Nunito', value: 'Nunito' },
    { label: 'Lato', value: 'Lato' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Theme Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Customize the app's appearance, colors, and branding</p>
      </div>

      {/* Branding */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Upload size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Branding</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div>
            <label className="form-label">Application Logo</label>
            <div
              {...getLogoProps()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
            >
              <input {...getLogoInput()} />
              {logoPreview || appLogo ? (
                <img
                  src={logoPreview || `/uploads/${appLogo}`}
                  alt="Logo"
                  className="h-14 mx-auto object-contain mb-2"
                />
              ) : (
                <div>
                  <Upload size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Upload logo</p>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">PNG, SVG recommended</p>
            </div>
          </div>

          {/* App Name */}
          <div className="flex flex-col justify-center">
            <label className="form-label">Application Name</label>
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="form-input"
              placeholder="HR Suite"
            />
            <p className="text-xs text-slate-400 mt-2">Shown in sidebar header and browser tab</p>

            <div className="mt-4">
              <label className="form-label">Dark Mode</label>
              <div className="flex items-center gap-3 mt-1">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={toggleDark}
                  onKeyDown={(e) => e.key === 'Enter' && toggleDark()}
                  style={{
                    width: 48, height: 26, borderRadius: 13,
                    background: isDark ? 'rgb(37,99,235)' : '#cbd5e1',
                    position: 'relative', cursor: 'pointer', flexShrink: 0,
                    transition: 'background 0.2s',
                    display: 'inline-block',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: isDark ? 25 : 3,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    transition: 'left 0.2s',
                  }} />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">{isDark ? 'Dark mode on' : 'Light mode'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Favicon Upload — super admin only */}
        {isSuperAdmin && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={15} className="text-primary-600" />
              <label className="form-label mb-0">Browser Tab Favicon</label>
            </div>
            <div className="flex items-start gap-4">
              <div
                {...getFaviconProps()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors w-40 flex-shrink-0"
              >
                <input {...getFaviconInput()} />
                {faviconPreview || appFavicon ? (
                  <img
                    src={faviconPreview || `/${appFavicon}`}
                    alt="Favicon"
                    className="w-10 h-10 mx-auto object-contain mb-1 rounded"
                  />
                ) : (
                  <div>
                    <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">HR</div>
                    <p className="text-xs text-slate-500">Default</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">ICO, PNG, SVG</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Shown in the browser tab and bookmarks.</p>
                <p className="text-xs text-slate-400 mb-3">Recommended: 32×32px ICO or 64×64px PNG. Max 1 MB.</p>
                {faviconFile && (
                  <button
                    onClick={() => uploadFaviconMutation.mutate(faviconFile)}
                    disabled={uploadFaviconMutation.isPending}
                    className="btn-primary text-sm"
                  >
                    {uploadFaviconMutation.isPending
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Globe size={14} />}
                    Upload Favicon
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Color Palette</h2>
        </div>

        {/* Preset palettes */}
        <div>
          <label className="form-label">Quick Presets</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PRESET_PALETTES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => { setPrimaryColor(p.primary); setSidebarColor(p.sidebar); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-xs transition-colors"
              >
                <span className="flex gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: p.primary }} />
                  <span className="w-4 h-4 rounded-full" style={{ background: p.sidebar }} />
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Primary Color</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="form-input font-mono"
                placeholder="#1E40AF"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Used for buttons, links, active states</p>
          </div>
          <div>
            <label className="form-label">Sidebar Color</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={sidebarColor}
                onChange={(e) => setSidebarColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <input
                type="text"
                value={sidebarColor}
                onChange={(e) => setSidebarColor(e.target.value)}
                className="form-input font-mono"
                placeholder="#0F172A"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Navigation sidebar background</p>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <label className="form-label">Preview</label>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-24">
            <div className="w-32 flex flex-col p-3 gap-1.5" style={{ background: sidebarColor }}>
              <div className="h-2 rounded-full opacity-70" style={{ background: primaryColor }} />
              <div className="h-2 rounded-full bg-white opacity-20 w-3/4" />
              <div className="h-2 rounded-full bg-white opacity-20 w-2/4" />
              <div className="h-2 rounded-full bg-white opacity-10 w-3/4" />
            </div>
            <div className="flex-1 bg-white dark:bg-slate-900 p-3 flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg text-white text-xs" style={{ background: primaryColor }}>
                Button
              </div>
              <div className="w-16 h-5 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Type size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Typography</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setSelectedFont(f.value)}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                selectedFont === f.value
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
              style={{ fontFamily: f.value }}
            >
              <p className="font-semibold text-sm text-slate-900 dark:text-white">{f.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">The quick brown fox</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettingsMutation.mutate()}
          disabled={saveSettingsMutation.isPending}
          className="btn-primary"
        >
          {saveSettingsMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          Apply & Save Theme
        </button>
      </div>
    </div>
  );
}
