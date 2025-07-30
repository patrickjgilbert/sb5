'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getRecentEvents, getSubmissionsByEventId, type Submission as LocalSubmission } from '@/lib/localStorage';

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
  challenges?: string;
  recommendations: string[];
  lastUpdated: string;
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

  // Load event data and submissions
  useEffect(() => {
    const loadEventData = async () => {
      try {
        console.log('Loading event data for eventId:', eventId);
        
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.log('Supabase environment variables not found, using localStorage fallback');
          // Fallback to localStorage
          loadFromLocalStorage();
          return;
        }

        // Try to fetch from Supabase
        const { supabase } = await import('@/lib/supabase');
        console.log('Attempting to fetch from Supabase...');
        
        // Fetch event details
        const { data: eventDetails, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        console.log('Supabase event query result:', { eventDetails, eventError });

        if (eventDetails && !eventError) {
          console.log('Found event in Supabase:', eventDetails);
          // Use real event data from Supabase
          setEventData({
            id: eventId,
            name: eventDetails.event_name,
            description: eventDetails.description || '',
            windowStart: eventDetails.window_start,
            windowEnd: eventDetails.window_end,
            createdAt: eventDetails.created_at,
          });

          // Fetch responses
          console.log('Fetching responses from Supabase...');
          const { data: responses, error: responsesError } = await supabase
            .from('responses')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

          console.log('Supabase responses query result:', { responses, responsesError });

          if (!responsesError && responses) {
            console.log(`Found ${responses.length} responses in Supabase`);
            const formattedSubmissions = responses.map(response => ({
              id: response.id.toString(),
              name: response.participant_name,
              availability: response.availability,
              submittedAt: response.created_at
            }));
            setSubmissions(formattedSubmissions);
          } else {
            console.log('No responses found or error fetching responses:', responsesError);
            setSubmissions([]);
          }
        } else {
          console.log('Event not found in Supabase, using localStorage fallback');
          loadFromLocalStorage();
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading event data from Supabase:', error);
        console.log('Falling back to localStorage');
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      console.log('Loading from localStorage...');
      // Fallback to localStorage or demo data
      const recentEvents = getRecentEvents();
      const currentEvent = recentEvents.find(event => event.id === eventId);
      
      if (currentEvent) {
        console.log('Found event in localStorage:', currentEvent);
        setEventData({
          id: eventId,
          name: currentEvent.name,
          description: currentEvent.description || '',
          windowStart: currentEvent.windowStart || new Date().toISOString().split('T')[0],
          windowEnd: currentEvent.windowEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: currentEvent.createdAt,
        });
      } else {
        console.log('Event not found in localStorage, using demo data');
        // Generate demo event based on eventId
        const demoEvents = [
          { 
            name: 'Team Meeting', 
            description: 'Weekly team sync to discuss project updates and plan next steps',
            windowStart: '2025-01-27',
            windowEnd: '2025-02-03'
          },
          { 
            name: 'Fantasy Football Draft', 
            description: 'Annual draft for our fantasy football league - let\'s find a time that works for everyone!',
            windowStart: '2025-01-28',
            windowEnd: '2025-02-05'
          },
          { 
            name: 'Book Club Discussion', 
            description: 'Discussion of this month\'s book selection. We\'ll need about 2 hours.',
            windowStart: '2025-01-29',
            windowEnd: '2025-02-10'
          },
          { 
            name: 'Project Planning Session', 
            description: 'Planning session for the Q4 project launch. All stakeholders should attend.',
            windowStart: '2025-01-30',
            windowEnd: '2025-02-07'
          },
          { 
            name: 'Family Dinner', 
            description: 'Monthly family gathering - looking for a weekend that works for everyone.',
            windowStart: '2025-02-01',
            windowEnd: '2025-02-15'
          }
        ];
        
        const eventIndex = parseInt(eventId.slice(-1)) % demoEvents.length;
        const selectedDemo = demoEvents[eventIndex];
        
        setEventData({
          id: eventId,
          name: selectedDemo.name,
          description: selectedDemo.description,
          windowStart: selectedDemo.windowStart,
          windowEnd: selectedDemo.windowEnd,
          createdAt: new Date().toISOString(),
        });
      }

      // Load submissions from localStorage
      const localSubmissions = getSubmissionsByEventId(eventId);
      console.log(`Found ${localSubmissions.length} submissions in localStorage for event ${eventId}`);
      
      if (localSubmissions.length > 0) {
        const formattedSubmissions = localSubmissions.map((submission: LocalSubmission) => ({
          id: submission.id,
          name: submission.name,
          availability: submission.availability,
          submittedAt: submission.submittedAt
        }));
        setSubmissions(formattedSubmissions);
      } else {
        setSubmissions([]);
      }
      
      setLoading(false);
    };

    loadEventData();
  }, [eventId]);

  // Function to load demo submissions for testing
  const loadDemoSubmissions = () => {
    const demoSubmissions = [
      {
        id: '1',
        name: 'Alex Chen',
        availability: 'Weekday evenings after 6 PM work best for me. I have a recurring meeting on Fridays at 2 PM, but that can be moved if necessary. Not available August 11-18 due to vacation.',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: '2', 
        name: 'Sarah Johnson',
        availability: 'I prefer mornings on weekends, but flexible for the right time. Evenings work too, ideally after 7 PM on weekdays when the kids are in bed.',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      },
      {
        id: '3',
        name: 'Mike Torres', 
        availability: 'I\'m on the West Coast, so early mornings your time work great for me. Just not available Fridays due to standing team meetings.',
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      },
      {
        id: '4',
        name: 'Emma Wilson',
        availability: 'Tuesday through Thursday evenings are ideal. I can do lunch meetings if it\'s the only option that works for everyone.',
        submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
      }
    ];
    
    setSubmissions(demoSubmissions);
  };

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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
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

        {/* Results Dashboard Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
            📊 Results Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            View participant responses and AI-generated meeting suggestions
          </p>
          
          <div className="flex justify-center gap-4">
            {submissions.length > 0 && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    🔄 Refresh Suggestions
                  </>
                )}
              </button>
            )}
            
            {submissions.length === 0 && (
              <button
                onClick={loadDemoSubmissions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                📝 Load Demo Submissions
              </button>
            )}
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📋 Submissions ({submissions.length})
              </h2>

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
                  {submissions.map((submission, index) => (
                    <div key={submission.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                            {submission.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {submission.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Participant #{index + 1}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Availability Response:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {submission.availability}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        📊 {submissions.length} response{submissions.length !== 1 ? 's' : ''} collected
                      </span>
                      <span>
                        🕒 Last updated: {submissions.length > 0 ? new Date(submissions[0].submittedAt).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            {/* Quick Stats / Event Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                📊 Event Summary
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {submissions.length}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    Participants
                  </div>
                </div>
                
                <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analysis?.suggestions?.length || 3}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">
                    Suggestions
                  </div>
                </div>
                
                <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ✓
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-300">
                    {eventData?.name || 'Event Ready'}
                  </div>
                </div>
              </div>
            </div>

            {analysis && (
              <>
                {/* AI Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    🧠 AI Analysis
                  </h2>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {analysis.summary}
                    </p>
                    {analysis.challenges && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 italic">
                        {analysis.challenges}
                      </p>
                    )}
                  </div>
                </div>

                {/* Suggested Meeting Times */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    🕒 Suggested Meeting Times
                  </h2>
                  
                  <div className="space-y-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              Option {index + 1}: {suggestion.date} at {suggestion.time}
                            </h3>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            suggestion.confidence.toLowerCase() === 'high' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : suggestion.confidence.toLowerCase() === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {suggestion.confidence.toLowerCase()} confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {suggestion.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    💡 Recommendations
                  </h2>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                      Consider sharing these options with your group for final voting.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Next Steps:</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated: {new Date(analysis.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📈 Quick Stats
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Submissions</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{submissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Event Window</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {eventData?.windowStart && eventData?.windowEnd
                      ? `${formatDateShort(eventData.windowStart)} to ${formatDateShort(eventData.windowEnd)}`
                      : 'Not set'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Event Form Created Date</span>
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