import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, Smartphone, Monitor, CheckCircle2, AlertCircle, Github, Cloud, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export const SyncSettings: React.FC = () => {
  const { t, appData, setAppData, mergeData, syncWithGist } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleExport = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `utopia_sync_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        mergeData(importedData);
        alert(t('syncSuccess'));
      } catch (error) {
        console.error('Import failed:', error);
        alert(t('syncError'));
      }
    };
    reader.readAsText(file);
  };

  const handleGistSync = async () => {
    setIsSyncing(true);
    await syncWithGist();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      {/* Device Mode Selection */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Smartphone className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{t('syncMode')}</h3>
            <p className="text-sm text-gray-400">{t('syncDescription')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setAppData({ ...appData, syncSettings: { ...appData.syncSettings, mode: 'pc' } })}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
              appData.syncSettings.mode === 'pc'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Monitor className="w-6 h-6" />
            <span className="text-sm font-medium">{t('pcMode')}</span>
            {appData.syncSettings.mode === 'pc' && <CheckCircle2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setAppData({ ...appData, syncSettings: { ...appData.syncSettings, mode: 'mobile' } })}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
              appData.syncSettings.mode === 'mobile'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-6 h-6" />
            <span className="text-sm font-medium">{t('mobileMode')}</span>
            {appData.syncSettings.mode === 'mobile' && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* GitHub Gist Sync */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Github className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{t('gistSync')}</h3>
            <p className="text-sm text-gray-400">{t('gistSyncDescription')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t('githubToken')}</label>
            <input
              type="password"
              placeholder={t('enterToken')}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none border border-white/10 focus:border-purple-500/50 transition-all"
              value={appData.syncSettings.githubToken || ''}
              onChange={(e) => setAppData({
                ...appData,
                syncSettings: { ...appData.syncSettings, githubToken: e.target.value }
              })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t('gistId')}</label>
            <input
              type="text"
              placeholder={t('enterGistId')}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none border border-white/10 focus:border-purple-500/50 transition-all"
              value={appData.syncSettings.gistId || ''}
              onChange={(e) => setAppData({
                ...appData,
                syncSettings: { ...appData.syncSettings, gistId: e.target.value }
              })}
            />
          </div>
        </div>

        <button
          onClick={handleGistSync}
          disabled={isSyncing}
          className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl text-white transition-all shadow-lg ${
            isSyncing ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20'
          }`}
        >
          {isSyncing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Cloud className="w-5 h-5" />
          )}
          <span className="text-sm font-bold">{t('gistSync')}</span>
        </button>
      </div>

      {/* Local Export/Import */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all"
        >
          <Download className="w-5 h-5" />
          <span className="text-sm font-medium">{t('exportSync')}</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-all shadow-lg shadow-blue-500/20"
        >
          <Upload className="w-5 h-5" />
          <span className="text-sm font-medium">{t('importSync')}</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />

      {appData.syncSettings.lastSync && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <AlertCircle className="w-3 h-3" />
          <span>{t('lastSync')}: {new Date(appData.syncSettings.lastSync).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};
