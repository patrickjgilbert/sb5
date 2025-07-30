'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface EventData {
  id: string;
  name: string;
  description: string;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
}

interface Submission {
  id: string;
  name: string;
  availability: string;
  submittedAt: string;
}

interface AnalysisResult {
  suggestions: Array<{
    date: string;
    time: string;
    confidence: string;
    notes: string;
  }>;
  summary: string;
  participantCount: number;
}

export default function AdminDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;
  const isNewlyCreated = searchParams.get('created') === 'true';

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyAnimation, setCopyAnimation] = useState(false);

  // Get event data from localStorage (where it was stored after creation)
  useEffect(() => {
    try {
      // First try to get from localStorage (if just created)
      const recentEvents = JSON.parse(localStorage.getItem('recentEvents') || '[]') as Array<{
        id: string;
        name: string;
        description?: string;
        createdAt: string;
      }>;
      const currentEvent = recentEvents.find(event => event.id === eventId);
      
      if (currentEvent) {
        // Calculate window dates based on creation time
        const createdDate = new Date(currentEvent.createdAt);
        const windowStart = createdDate.toISOString().split('T')[0];
        const windowEnd = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        setEventData({
          id: eventId,
          name: currentEvent.name,
          description: currentEvent.description || '',
          windowStart: windowStart,
          windowEnd: windowEnd,
          createdAt: currentEvent.createdAt,
        });
      } else {
        // Fallback to default data for demonstration
        setEventData({
          id: eventId,
          name: 'Event',
          description: 'Scheduling coordination event',
          windowStart: new Date().toISOString().split('T')[0],
          windowEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        });
      }

      // TODO: In a real app, also fetch submissions from API
      // For now, using empty array
      setSubmissions([]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading event data:', error);
      setError('Failed to load event data');
      setLoading(false);
    }
  }, [eventId]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze submissions');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing:', error);
      setError('Failed to analyze submissions. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyAnimation(true);
      setTimeout(() => setCopyAnimation(false), 300);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateEventWindow = () => {
    if (!eventData?.windowStart || !eventData?.windowEnd) return 0;
    const start = new Date(eventData.windowStart);
    const end = new Date(eventData.windowEnd);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const participantUrl = `${baseUrl}/event/${eventId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            ← Back to Home
          </Link>
          
          {isNewlyCreated && (
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                🎉 Event Created Successfully!
              </h2>
              <p className="text-green-800 dark:text-green-200">
                Your event is ready. Share the participant link below to start collecting availability.
              </p>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {eventData?.name}
          </h1>
          {eventData?.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {eventData.description}
            </p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Event ID: {eventId} • Window: {eventData?.windowStart && formatDate(eventData.windowStart)} to {eventData?.windowEnd && formatDate(eventData.windowEnd)}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details & Share */}
          <div className="lg:col-span-2 space-y-6">
            {/* Share Links */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📤 Share Your Event
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Participant Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={participantUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => handleCopyLink(participantUrl)}
                    className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition-all duration-200 ${
                      copyAnimation ? 'scale-95 bg-green-600' : ''
                    }`}
                  >
                    {copyAnimation ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Share this link with participants to collect their availability
                </p>
              </div>
            </div>

            {/* Submissions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📋 Submissions ({submissions.length})
                </h2>
                {submissions.length > 0 && (
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      '🤖 Get AI Recommendations'
                    )}
                  </button>
                )}
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Share your participant link to start collecting availability from your group.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {submission.name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {submission.availability}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            {analysis && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  🤖 AI Recommendations
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Summary
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      {analysis.summary}
                    </p>
                  </div>

                  {analysis.suggestions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Best Meeting Times
                      </h3>
                      <div className="space-y-2">
                        {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {suggestion.date} at {suggestion.time}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {suggestion.notes}
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                suggestion.confidence === 'high' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                  : suggestion.confidence === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              }`}>
                                {suggestion.confidence}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📊 Quick Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Submissions</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{submissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Event Window</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {calculateEventWindow()} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Window Dates</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {eventData?.windowStart} to {eventData?.windowEnd}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Created</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {eventData?.createdAt ? new Date(eventData.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 