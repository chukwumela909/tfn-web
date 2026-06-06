'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QueueComment {
  _id: string;
  username: string;
  text: string;
}

interface CommentQueue {
  _id: string;
  comments: QueueComment[];
  streamId: string;
  status: string;
  generatedAt: string;
  customPrompt?: string;
  batchSize: number;
}

export default function AICommentsPage() {
  const [batchSize, setBatchSize] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('');
  const [streamId, setStreamId] = useState('global');
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [currentQueue, setCurrentQueue] = useState<CommentQueue | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [latestStream, setLatestStream] = useState<any>(null);
  const [programContext, setProgramContext] = useState('');
  const [savingContext, setSavingContext] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);

  // Fetch latest stream
  useEffect(() => {
    const fetchLatestStream = async () => {
      try {
        const response = await fetch('/api/streams/list?status=idle');
        if (response.ok) {
          const data = await response.json();
          if (data.streams && data.streams.length > 0) {
            const stream = data.streams[0];
            setLatestStream(stream);
            setStreamId(stream.muxStreamId);
          }
        }
      } catch (error) {
        console.error('Error fetching stream:', error);
      }
    };
    fetchLatestStream();
  }, []);

  // Load the saved program context (persisted on the global config)
  useEffect(() => {
    const fetchProgramContext = async () => {
      try {
        const response = await fetch('/api/admin/viewer-config?streamId=global');
        if (response.ok) {
          const data = await response.json();
          setProgramContext(data.config?.programContext ?? '');
        }
      } catch (error) {
        console.error('Error fetching program context:', error);
      }
    };
    fetchProgramContext();
  }, []);

  const handleSaveContext = async () => {
    setSavingContext(true);
    setContextSaved(false);
    try {
      const response = await fetch('/api/admin/viewer-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: 'global',
          programContext,
        }),
      });

      if (response.ok) {
        setContextSaved(true);
        setTimeout(() => setContextSaved(false), 3000);
      } else {
        const error = await response.json();
        alert(`Failed to save context: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving context:', error);
      alert('Failed to save program context');
    } finally {
      setSavingContext(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/admin/comments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSize,
          customPrompt: customPrompt.trim() || undefined,
          streamId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generate response:', data);
        
        // Set the current queue with the full queue object including _id
        const newQueue = {
          _id: data.queueId,
          comments: data.comments,
          streamId: streamId,
          status: 'pending',
          generatedAt: data.generatedAt,
          customPrompt: customPrompt.trim() || undefined,
          batchSize: batchSize,
        };
        
        console.log('Setting current queue:', newQueue);
        setCurrentQueue(newQueue);
        alert(`✅ Generated ${data.comments.length} comments!`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating:', error);
      alert('Failed to generate comments');
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (comment: QueueComment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!currentQueue) return;

    try {
      const response = await fetch('/api/admin/comments/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: currentQueue._id,
          commentId,
          newText: editText,
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedComments = currentQueue.comments.map(c =>
          c._id === commentId ? { ...c, text: editText } : c
        );
        setCurrentQueue({ ...currentQueue, comments: updatedComments });
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error editing:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!currentQueue || !confirm('Delete this comment?')) return;

    try {
      const response = await fetch(
        `/api/admin/comments/delete?queueId=${currentQueue._id}&commentId=${commentId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        const updatedComments = currentQueue.comments.filter(c => c._id !== commentId);
        setCurrentQueue({ ...currentQueue, comments: updatedComments });
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handlePostAll = async () => {
    if (!currentQueue || !confirm(`Post all ${currentQueue.comments.length} comments to live stream?`)) return;

    setPosting(true);
    try {
      console.log('Posting comments, queueId:', currentQueue._id);
      const response = await fetch('/api/admin/comments/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: currentQueue._id,
        }),
      });

      const data = await response.json();
      console.log('Post response:', data);

      if (response.ok) {
        alert(`✅ Posted ${data.posted} comments!`);
        setCurrentQueue(null);
      } else {
        alert(`Failed to post comments: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error posting:', error);
      alert(`Failed to post comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!currentQueue || !confirm('Delete entire queue?')) return;

    try {
      const response = await fetch(
        `/api/admin/comments/delete?queueId=${currentQueue._id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setCurrentQueue(null);
      }
    } catch (error) {
      console.error('Error deleting queue:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/viewer-config"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Viewer Config
          </Link>
          <h1 className="text-4xl font-bold mb-2">🤖 AI Comment Generator</h1>
          <p className="text-slate-400">
            Generate authentic gospel comments using AI
            {latestStream && ` for "${latestStream.title}"`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Generator */}
          <div className="space-y-6">
            {/* Program Context (persistent) */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-2">Program Context</h2>
              <p className="text-sm text-slate-400 mb-3">
                Saved background about the program (theme, guest minister, scripture,
                audience). Applied automatically to every generation.
              </p>
              <textarea
                value={programContext}
                onChange={(e) => setProgramContext(e.target.value)}
                placeholder="E.g., Tonight's theme is Healing & Restoration. Guest minister: Pastor John. Audience is mostly West African. Scripture: Isaiah 53."
                className="w-full h-28 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleSaveContext}
                  disabled={savingContext}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  {savingContext ? 'Saving...' : '💾 Save Context'}
                </button>
                {contextSaved && (
                  <span className="text-sm text-green-400">✓ Saved</span>
                )}
              </div>
            </div>

            {/* Batch Size */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Batch Size</h2>
              <div className="space-y-3">
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-blue-400">
                  {batchSize} comments
                </div>
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-2">Custom Theme (Optional)</h2>
              <p className="text-sm text-slate-400 mb-3">
                One-off steer for this batch only (not saved). Leave blank for a natural mix.
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g., 'Generate comments about financial breakthrough' or paste a sample comment for AI to create variations"
                className="w-full h-24 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400"
              />
              <p className="text-sm text-slate-400 mt-2">
                💡 Tip: Leave this blank to generate a natural mix of comments.
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
            >
              {generating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Generating with AI...
                </>
              ) : (
                <>
                  🤖 Generate {batchSize} Comments
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Preview Queue */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                📝 Preview Queue {currentQueue && `(${currentQueue.comments.length})`}
              </h2>
              {currentQueue && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAll}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    🗑️ Delete All
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm disabled:bg-slate-600"
                  >
                    🔄 Regenerate
                  </button>
                </div>
              )}
            </div>

            {!currentQueue ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-6xl mb-4">🤖</div>
                <p>No comments generated yet</p>
                <p className="text-sm mt-2">Click "Generate" to create comments</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[500px] overflow-y-auto mb-4 pr-2">
                  {currentQueue.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-slate-700 rounded-lg p-3 border border-slate-600"
                    >
                      {editingId === comment._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-slate-600 border border-slate-500 rounded p-2 text-white text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(comment._id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-semibold text-blue-400 text-sm">
                              {comment.username}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(comment)}
                                className="text-xs text-slate-400 hover:text-blue-400"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(comment._id)}
                                className="text-xs text-slate-400 hover:text-red-400"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-white/90">{comment.text}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handlePostAll}
                  disabled={posting || currentQueue.comments.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  {posting ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Posting to Stream...
                    </>
                  ) : (
                    <>
                      🚀 Post All {currentQueue.comments.length} Comments
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
