'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ViewerConfig {
  streamId: string;
  minViewers: number;
  maxViewers: number;
  variationSpeed: number;
  isActive: boolean;
  commentsActive: boolean;
}

export default function AdminViewerConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ViewerConfig | null>(null);
  const [minViewers, setMinViewers] = useState(900000);
  const [maxViewers, setMaxViewers] = useState(1000000);
  const [variationSpeed, setVariationSpeed] = useState(1000);
  const [isActive, setIsActive] = useState(true);
  const [commentsActive, setCommentsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch current config
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/viewer-config?streamId=global');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setMinViewers(data.config.minViewers);
        setMaxViewers(data.config.maxViewers);
        setVariationSpeed(data.config.variationSpeed);
        setIsActive(data.config.isActive);
        setCommentsActive(data.config.commentsActive ?? true);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (maxViewers <= minViewers) {
      setError('Maximum viewers must be greater than minimum viewers');
      return;
    }

    if (minViewers < 0 || maxViewers < 0) {
      setError('Viewer counts cannot be negative');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/admin/viewer-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: 'global',
          minViewers,
          maxViewers,
          variationSpeed,
          isActive,
          commentsActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Configuration updated successfully! Changes will apply in real-time.');
        setConfig(data.config);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const presets = [
    { name: 'Low (0-50K)', min: 0, max: 50000 },
    { name: 'Medium (50K-200K)', min: 50000, max: 200000 },
    { name: 'High (200K-500K)', min: 200000, max: 500000 },
    { name: 'Very High (500K-1M)', min: 500000, max: 1000000 },
    { name: 'Ultra (900K-1M)', min: 900000, max: 1000000 },
  ];

  const applyPreset = (preset: { min: number; max: number }) => {
    setMinViewers(preset.min);
    setMaxViewers(preset.max);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin: Viewer Count Control</h1>
            <p className="text-slate-400 text-sm mt-1">Manage simulated viewer counts in real-time</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-600/20 border border-green-600 rounded-lg">
            <p className="text-green-400">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Current Stats */}
        <div className="mb-8 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Current Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Viewer Status</p>
              <p className="text-2xl font-bold">
                {config?.isActive ? (
                  <span className="text-green-400">Active</span>
                ) : (
                  <span className="text-red-400">Paused</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Comments</p>
              <p className="text-2xl font-bold">
                {config?.commentsActive ? (
                  <span className="text-green-400">Active</span>
                ) : (
                  <span className="text-orange-400">Paused</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Min Viewers</p>
              <p className="text-2xl font-bold">{config?.minViewers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Max Viewers</p>
              <p className="text-2xl font-bold">{config?.maxViewers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Update Speed</p>
              <p className="text-2xl font-bold">{config?.variationSpeed}ms</p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Update Configuration</h2>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Viewer Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Viewers
                </label>
                <input
                  type="number"
                  value={minViewers}
                  onChange={(e) => setMinViewers(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1"
                />
                <p className="text-slate-400 text-xs mt-1">
                  {minViewers.toLocaleString()} viewers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Viewers
                </label>
                <input
                  type="number"
                  value={maxViewers}
                  onChange={(e) => setMaxViewers(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1"
                />
                <p className="text-slate-400 text-xs mt-1">
                  {maxViewers.toLocaleString()} viewers
                </p>
              </div>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-sm font-medium mb-2">Quick Presets</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Variation Speed */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Variation Speed (ms)
              </label>
              <input
                type="range"
                value={variationSpeed}
                onChange={(e) => setVariationSpeed(parseInt(e.target.value))}
                min="500"
                max="5000"
                step="100"
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-1">
                <span>Fast (500ms)</span>
                <span className="font-bold text-white">{variationSpeed}ms</span>
                <span>Slow (5000ms)</span>
              </div>
            </div>

            {/* Toggles Section */}
            <div className="space-y-4">
              {/* Viewer Simulation Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <p className="font-medium">Viewer Count Simulation</p>
                  <p className="text-sm text-slate-400">
                    {isActive ? 'Viewer count simulation is active' : 'Viewer count simulation is paused'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    isActive ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      isActive ? 'translate-x-8' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Comments Simulation Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <p className="font-medium">Simulated Comments</p>
                  <p className="text-sm text-slate-400">
                    {commentsActive 
                      ? 'Simulated gospel comments are active' 
                      : 'Simulated comments paused (real user comments still work)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsActive(!commentsActive)}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    commentsActive ? 'bg-green-600' : 'bg-orange-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      commentsActive ? 'translate-x-8' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Update Configuration'}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
          <h3 className="font-bold mb-2 text-blue-400">ℹ️ How it works:</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Changes apply instantly to all pages (Home, Live, Host)</li>
            <li>• Viewer count fluctuates randomly within your set range</li>
            <li>• Variation speed controls how often the count updates</li>
            <li>• Pause simulation to show static viewer counts</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
