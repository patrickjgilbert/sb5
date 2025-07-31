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
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto-refresh interval (in milliseconds)
  const REFRESH_INTERVAL = 30000; // 30 seconds

  // Load event data and submissions
  useEffect(() => {
    const loadEventData = async () => {
      try {
        console.log('Loading event data for eventId:', eventId);
        
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.log('Supabase environment variables not found, using localStorage fallback');
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

        if (eventDetails && !eventError) {
          console.log('Found event in Supabase:', eventDetails);
          setEventData({
            id: eventId,
            name: eventDetails.event_name,
            description: eventDetails.description || '',
            windowStart: eventDetails.window_start,
            windowEnd: eventDetails.window_end,
            createdAt: eventDetails.created_at,
          });

          // Fetch responses
          const { data: responses, error: responsesError } = await supabase
            .from('responses')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

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
      // Generate demo event based on eventId with realistic current dates
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      const demoEvents = [
        { 
          name: 'Team Meeting', 
          description: 'Weekly team sync to discuss project updates and plan next steps',
        },
        { 
          name: 'Fantasy Football Draft', 
          description: 'Annual draft for our fantasy football league - let\'s find a time that works for everyone!',
        },
        { 
          name: 'Book Club Discussion', 
          description: 'Discussion of this month\'s book selection. We\'ll need about 2 hours.',
        },
        { 
          name: 'Project Planning Session', 
          description: 'Planning session for the Q4 project launch. All stakeholders should attend.',
        },
        { 
          name: 'Family Dinner', 
          description: 'Monthly family gathering - looking for a weekend that works for everyone.',
        }
      ];
      
      const eventIndex = parseInt(eventId.slice(-1)) % demoEvents.length;
      const selectedDemo = demoEvents[eventIndex];
      
      setEventData({
        id: eventId,
        name: selectedDemo.name,
        description: selectedDemo.description,
        windowStart: formatDate(today),
        windowEnd: formatDate(thirtyDaysFromNow),
        createdAt: new Date().toISOString(),
      });

      // Generate demo submissions for testing
      const demoSubmissions = [
        {
          id: '1',
          name: 'Alex Chen',
          availability: 'Weekday evenings after 6 PM work best for me. I have a recurring meeting on Fridays at 2 PM, but that can be moved if necessary. Not available August 11-18 due to vacation.',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2', 
          name: 'Sarah Johnson',
          availability: 'I prefer mornings on weekends, but flexible for the right time. Evenings work too, ideally after 7 PM on weekdays when the kids are in bed.',
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Mike Torres', 
          availability: 'I\'m on the West Coast, so early mornings your time work great for me. Just not available Fridays due to standing team meetings.',
          submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setSubmissions(demoSubmissions);
      setLoading(false);
    };

    loadEventData();
  }, [eventId]);

  // Auto-refresh submissions
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        console.log('Auto-refreshing submissions...');
        // Re-fetch submissions without changing loading state
        const refreshSubmissions = async () => {
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            try {
              const { supabase } = await import('@/lib/supabase');
              const { data: responses, error: responsesError } = await supabase
                .from('responses')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

              if (!responsesError && responses) {
                const formattedSubmissions = responses.map(response => ({
                  id: response.id.toString(),
                  name: response.participant_name,
                  availability: response.availability,
                  submittedAt: response.created_at
                }));
                
                // Only update if there are changes
                if (formattedSubmissions.length !== submissions.length) {
                  setSubmissions(formattedSubmissions);
                }
              }
            } catch (error) {
              console.error('Error refreshing submissions:', error);
            }
          }
        };
        
        refreshSubmissions();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [eventId, loading, submissions.length]);

  // Note: Analysis is now manual only to avoid excessive OpenAI API costs
  // Users must click the "Generate AI Suggestions" button to run analysis

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Add cache-busting timestamp
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ 
          eventId, 
          timestamp: Date.now() // Cache busting
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze submissions');
      }

      const result = await response.json();
      console.log('Fresh analysis result:', result.suggestions); // Debug logging
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
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleOpenForm = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const participantUrl = `${baseUrl}/event/${eventId}`;
    window.open(participantUrl, '_blank');
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header with Back Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            ← Back to Home
          </Link>
          
          {isNewlyCreated && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                🎉 Event Created Successfully!
              </h2>
              <p className="text-green-800">
                Your event is ready. Share the participant link below to start collecting availability.
              </p>
            </div>
          )}

          {/* Event Title and Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {eventData?.name || 'Event Admin Dashboard'}
            </h1>
            
            {eventData?.description && (
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                {eventData.description}
              </p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 rounded-lg p-3">
                <span className="font-medium text-blue-900">Event ID:</span>
                <br />
                <span className="text-blue-700 font-mono">{eventId}</span>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3">
                <span className="font-medium text-green-900">Start Date:</span>
                <br />
                <span className="text-green-700">
                  {eventData?.windowStart ? formatDate(eventData.windowStart) : 'Not set'}
                </span>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3">
                <span className="font-medium text-purple-900">End Date:</span>
                <br />
                <span className="text-purple-700">
                  {eventData?.windowEnd ? formatDate(eventData.windowEnd) : 'Not set'}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="font-medium text-gray-900">Created:</span>
                <br />
                <span className="text-gray-700">
                  {eventData?.createdAt ? new Date(eventData.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Share Your Event Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📮 Share Your Event
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event participant form URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={participantUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => handleCopyLink(participantUrl)}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    copySuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {copySuccess ? '✓ Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleOpenForm}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Form in New Tab
            </button>
          </div>
        </div>

        {/* 2. Event Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Event Summary
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">
                {submissions.length}
              </div>
              <div className="text-sm text-blue-800">
                Total Responses
              </div>
            </div>
            
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">
                {eventData?.name || 'Event'}
              </div>
              <div className="text-sm text-green-800">
                Event Name
              </div>
            </div>
            
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600">
                {analysis?.suggestions?.length || 3}
              </div>
              <div className="text-sm text-purple-800">
                Meeting Suggestions
              </div>
            </div>
          </div>
        </div>

        {/* 3. AI Analysis & Suggested Times (Primary Focus) */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              🧠 AI Analysis & Suggested Times
            </h2>
            
            {/* AI Summary */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 leading-relaxed">
                {analysis.summary}
              </p>
              {analysis.challenges && (
                <p className="text-gray-600 text-sm mt-3 italic">
                  <strong>Challenges:</strong> {analysis.challenges}
                </p>
              )}
            </div>

            {/* Suggested Meeting Times */}
            <div className="space-y-4">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      🕒 Option {index + 1}: {suggestion.date} at {suggestion.time}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 sm:mt-0 ${
                      suggestion.confidence.toLowerCase() === 'high' 
                        ? 'bg-green-100 text-green-800'
                        : suggestion.confidence.toLowerCase() === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      ↳ Confidence Level: {suggestion.confidence}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    ↳ Reasoning: {suggestion.notes}
                  </p>
                </div>
              ))}
            </div>

                         {/* Refresh Analysis Button */}
             <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
               <button
                 onClick={handleAnalyze}
                 disabled={isAnalyzing}
                 className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
               >
                 {isAnalyzing ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Analyzing...
                   </>
                 ) : (
                   '🔄 Refresh Analysis'
                 )}
               </button>
               
               <button
                 onClick={() => {
                   setAnalysis(null);
                   handleAnalyze();
                 }}
                 disabled={isAnalyzing}
                 className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
               >
                 🔥 Force Fresh Analysis
               </button>
             </div>
          </div>
        )}

                 {/* No Analysis State */}
         {!analysis && submissions.length > 0 && (
           <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg shadow-md p-8 text-center">
             <h2 className="text-xl font-semibold text-gray-900 mb-4">
               🧠 AI Analysis & Suggested Times
             </h2>
             <div className="bg-white rounded-lg p-4 mb-6 border border-purple-100">
               <p className="text-gray-700 mb-2">
                 <strong>✅ You have {submissions.length} response{submissions.length !== 1 ? 's' : ''}!</strong>
               </p>
               <p className="text-gray-600 text-sm">
                 Click below to generate AI-powered meeting suggestions based on participant availability.
               </p>
             </div>
             <button
               onClick={handleAnalyze}
               disabled={isAnalyzing}
               className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-lg font-semibold rounded-lg transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
             >
               {isAnalyzing ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Analyzing Responses...
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                   </svg>
                   🤖 Generate AI Suggestions
                 </>
               )}
             </button>
           </div>
         )}

        {/* 4. Individual Submissions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🧾 Individual Submissions
          </h2>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No submissions yet
              </h3>
              <p className="text-gray-600">
                Share your participant link to start collecting availability from your group.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {submission.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {submission.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Participant #{index + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {formatDate(submission.submittedAt)}
                      <br />
                      {formatTime(submission.submittedAt)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Original availability response:
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {submission.availability}
                    </p>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400">
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Auto-refresh Info */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>📡 This page auto-refreshes every 30 seconds to show new participant responses</p>
          <p className="text-xs mt-1">💡 AI analysis is manual only - click "Generate AI Suggestions" to run analysis</p>
          {analysis && (
            <p className="mt-1">
              Last AI analysis: {new Date(analysis.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

      </div>
    </div>
  );
} 