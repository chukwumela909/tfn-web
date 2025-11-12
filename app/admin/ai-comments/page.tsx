'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QueueComment {
  _id: string;
  username: string;
  text: string;
  style: string;
}

interface CommentQueue {
  _id: string;
  comments: QueueComment[];
  streamId: string;
  status: string;
  generatedAt: string;
  customPrompt?: string;
  batchSize: number;
  styles: string[];
}

export default function AICommentsPage() {
  const [styles, setStyles] = useState({
    praise: true,
    testimonial: true,
    prayer: true,
    interactive: true,
  });
  const [batchSize, setBatchSize] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('');
  const [streamId, setStreamId] = useState('global');
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [currentQueue, setCurrentQueue] = useState<CommentQueue | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [latestStream, setLatestStream] = useState<any>(null);

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

  const selectedStyles = Object.entries(styles)
    .filter(([_, enabled]) => enabled)
    .map(([style]) => style);

  const handleGenerate = async () => {
    // Allow generation with either styles OR custom prompt (or both)
    if (selectedStyles.length === 0 && !customPrompt.trim()) {
      alert('Please select at least one comment style OR enter a custom prompt');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/comments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styles: selectedStyles.length > 0 ? selectedStyles : ['custom'],
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
          styles: selectedStyles.length > 0 ? selectedStyles : ['custom'],
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
            {/* Comment Styles */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-2">Comment Styles (Optional)</h2>
              <p className="text-sm text-slate-400 mb-4">
                Select styles to mix, or leave unchecked to use custom theme only
              </p>
              <div className="space-y-3">
                {Object.entries(styles).map(([style, enabled]) => (
                  <label key={style} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setStyles({ ...styles, [style]: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600"
                    />
                    <span className="flex-1 capitalize">{style}</span>
                    <span className="text-sm text-slate-400">
                      {style === 'praise' && '🙌 Hallelujah! Glory!'}
                      {style === 'testimonial' && '🙏 I receive healing!'}
                      {style === 'prayer' && '😭 Lord bless my family'}
                      {style === 'interactive' && '🇳🇬 Watching from Lagos!'}
                    </span>
                  </label>
                ))}
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
              <h2 className="text-xl font-bold mb-2">Custom Theme</h2>
              <p className="text-sm text-slate-400 mb-3">
                Can be used alone or combined with styles above
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g., 'Generate comments about financial breakthrough' or paste a sample comment for AI to create variations"
                className="w-full h-24 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400"
              />
              <p className="text-sm text-slate-400 mt-2">
                💡 Tip: You can generate using custom theme only, no styles needed!
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || (selectedStyles.length === 0 && !customPrompt.trim())}
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
                          <span className="text-xs text-slate-500 capitalize mt-1 inline-block">
                            {comment.style}
                          </span>
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
