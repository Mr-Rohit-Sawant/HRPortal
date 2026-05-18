import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Check, Type } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useThemeStore } from '../../stores/themeStore';
import { settingsService } from '../../services/settingsService';
import toast from 'react-hot-toast';

const SYSTEM_FONTS = [
  { name: 'Inter', value: 'Inter', category: 'Sans Serif' },
  { name: 'Roboto', value: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', value: 'Open Sans', category: 'Sans Serif' },
  { name: 'Poppins', value: 'Poppins', category: 'Sans Serif' },
  { name: 'Nunito', value: 'Nunito', category: 'Sans Serif' },
  { name: 'Lato', value: 'Lato', category: 'Sans Serif' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro', category: 'Sans Serif' },
  { name: 'Montserrat', value: 'Montserrat', category: 'Sans Serif' },
  { name: 'DM Sans', value: 'DM Sans', category: 'Sans Serif' },
  { name: 'Figtree', value: 'Figtree', category: 'Sans Serif' },
  { name: 'Georgia', value: 'Georgia', category: 'Serif' },
  { name: 'Merriweather', value: 'Merriweather', category: 'Serif' },
  { name: 'Courier New', value: 'Courier New', category: 'Monospace' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'Monospace' },
];

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog. 0123456789';
const FONT_SIZES = [12, 14, 16, 18, 24, 32];

export default function FontManagementView() {
  const { fontFamily, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(fontFamily || 'Inter');
  const [previewSize, setPreviewSize] = useState(16);
  const [uploadedFonts, setUploadedFonts] = useState<{ name: string; url: string }[]>([]);
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [customFontName, setCustomFontName] = useState('');

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'font/ttf': ['.ttf'], 'font/otf': ['.otf'], 'font/woff': ['.woff'], 'font/woff2': ['.woff2'] },
    maxFiles: 1,
    onDrop: (files) => { if (files[0]) { setFontFile(files[0]); setCustomFontName(files[0].name.replace(/\.\w+$/, '')); } },
  });

  const uploadFontMutation = useMutation({
    mutationFn: async () => {
      if (!fontFile) return;
      const fd = new FormData();
      fd.append('font', fontFile);
      fd.append('fontName', customFontName);
      return settingsService.uploadFont(fd);
    },
    onSuccess: () => { toast.success('Font uploaded'); setFontFile(null); setCustomFontName(''); },
  });

  const applyFontMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('fontFamily', selected);
      return settingsService.updateSettings(fd);
    },
    onSuccess: () => {
      setTheme({ fontFamily: selected });
      document.documentElement.style.setProperty('--font-family', selected);
      toast.success(`Font changed to ${selected}`);
    },
  });

  const categories = [...new Set(SYSTEM_FONTS.map((f) => f.category))];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Font Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Select the application-wide typeface</p>
      </div>

      {/* Preview Controls */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Type size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Live Preview</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500">Preview size:</span>
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setPreviewSize(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewSize === s ? 'bg-primary-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {s}px
            </button>
          ))}
        </div>
        <div
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          style={{ fontFamily: selected, fontSize: `${previewSize}px` }}
        >
          <p className="text-slate-900 dark:text-white font-bold mb-1">{selected} — Bold heading</p>
          <p className="text-slate-700 dark:text-slate-300">{SAMPLE_TEXT}</p>
          <p className="text-slate-500 text-sm mt-1">Secondary text and labels look like this</p>
        </div>
      </div>

      {/* System Fonts */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">System Fonts</h2>
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{cat}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SYSTEM_FONTS.filter((f) => f.category === cat).map((font) => (
                <button
                  key={font.value}
                  onClick={() => setSelected(font.value)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                    selected === font.value
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white" style={{ fontFamily: font.value }}>
                      {font.name}
                    </p>
                    <p className="text-xs text-slate-500" style={{ fontFamily: font.value }}>Aa Bb Cc 123</p>
                  </div>
                  {selected === font.value && <Check size={16} className="text-primary-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Font Upload */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Upload Custom Font</h2>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          <input {...getInputProps()} />
          <Upload size={28} className="mx-auto text-slate-300 mb-2" />
          {fontFile ? (
            <p className="text-sm text-green-600 font-medium">{fontFile.name}</p>
          ) : (
            <>
              <p className="text-sm text-slate-500">Drop a font file here</p>
              <p className="text-xs text-slate-400 mt-1">TTF, OTF, WOFF, WOFF2 supported</p>
            </>
          )}
        </div>
        {fontFile && (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="form-label">Font Display Name</label>
              <input
                value={customFontName}
                onChange={(e) => setCustomFontName(e.target.value)}
                className="form-input"
              />
            </div>
            <button
              onClick={() => uploadFontMutation.mutate()}
              disabled={!customFontName || uploadFontMutation.isPending}
              className="btn-primary"
            >
              {uploadFontMutation.isPending ? 'Uploading...' : <><Upload size={16} /> Upload</>}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={() => applyFontMutation.mutate()} disabled={applyFontMutation.isPending} className="btn-primary">
          {applyFontMutation.isPending ? 'Applying...' : <><Check size={16} /> Apply Font</>}
        </button>
      </div>
    </div>
  );
}
