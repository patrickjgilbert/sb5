'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getRecentEvents } from '@/lib/localStorage';

interface EventData {
  id: string;
  name: string;
  description: string;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
}

export default function ParticipantPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    availability: ''
  });

  // Format date for display (e.g., "July 29th")
  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric'
    };
    const formatted = date.toLocaleDateString('en-US', options);
    
    // Add ordinal suffix
    const day = date.getDate();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';
    
    return formatted.replace(/\d+/, day + suffix);
  };

  // Get event data - try localStorage first, then fallback
  useEffect(() => {
    const loadEventData = async () => {
      try {
        // Get from localStorage using the correct function
        const recentEvents = getRecentEvents();
        const currentEvent = recentEvents.find(event => event.id === eventId);
        
        if (currentEvent) {
          // Use actual event data from localStorage
          setEventData({
            id: eventId,
            name: currentEvent.name,
            description: currentEvent.description || 'Please share your availability so we can find the best time for everyone.',
            windowStart: currentEvent.windowStart || new Date().toISOString().split('T')[0],
            windowEnd: currentEvent.windowEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: currentEvent.createdAt,
          });
          setLoading(false);
          return;
        }

        // If not in localStorage, try to fetch from API (for real implementation)
        // For now, we'll create a more realistic fallback based on eventId
        // In a production app, this would be: const response = await fetch(`/api/events/${eventId}`)
        
        // Generate a more realistic demo event based on eventId with current dates
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        
        const demoEvents = [
          { 
            name: 'Team Meeting', 
            description: 'Weekly team sync to discuss project updates and plan next steps',
            windowStart: formatDate(today),
            windowEnd: formatDate(thirtyDaysFromNow)
          },
          { 
            name: 'Fantasy Football Draft', 
            description: 'Annual draft for our fantasy football league - let\'s find a time that works for everyone!',
            windowStart: formatDate(today),
            windowEnd: formatDate(thirtyDaysFromNow)
          },
          { 
            name: 'Book Club Discussion', 
            description: 'Discussion of this month\'s book selection. We\'ll need about 2 hours.',
            windowStart: formatDate(today),
            windowEnd: formatDate(thirtyDaysFromNow)
          },
          { 
            name: 'Project Planning Session', 
            description: 'Planning session for the Q4 project launch. All stakeholders should attend.',
            windowStart: formatDate(today),
            windowEnd: formatDate(thirtyDaysFromNow)
          },
          { 
            name: 'Family Dinner', 
            description: 'Monthly family gathering - looking for a weekend that works for everyone.',
            windowStart: formatDate(today),
            windowEnd: formatDate(thirtyDaysFromNow)
          }
        ];
        
        // Use eventId to pick a consistent demo event
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
        setLoading(false);
        
      } catch (error) {
        console.error('Error loading event data:', error);
        // Final fallback if everything fails
        setEventData({
          id: eventId,
          name: 'Scheduling Event',
          description: 'Please share your availability so we can find the best time for everyone.',
          windowStart: new Date().toISOString().split('T')[0],
          windowEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        });
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          name: formData.name,
          availability: formData.availability
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit availability');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting:', error);
      setError('Failed to submit your availability. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Thank You!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your availability has been submitted successfully. The event organizer will analyze all responses and share the best meeting times with the group.
          </p>
          
          {/* Link back to participant form */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📢 Help Us Get Everyone&apos;s Input
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
              The more responses we collect, the better our AI can find times that work for everyone. 
              Please remind others in your group to fill out their availability too!
            </p>
            <Link
              href={`/event/${eventId}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              📋 Participant Form Link
            </Link>
          </div>

          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
          >
            Create Your Own Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            ← Create Your Own Event
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {eventData?.name}
          </h1>
          {eventData?.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {eventData.description}
            </p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Scheduling window: {eventData?.windowStart && formatDateShort(eventData.windowStart)} to {eventData?.windowEnd && formatDateShort(eventData.windowEnd)}
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📝 How This Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>Enter your name and describe when you&apos;re available</li>
            <li>Use natural language - be as specific or general as you like. Include times that are less than ideal or when you&apos;re flexible</li>
            <li>AI will analyze everyone&apos;s responses to find the best meeting times</li>
            <li>The organizer will share the recommended times with the group</li>
          </ol>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter your full name"
              />
            </div>

            {/* Availability Text Area */}
            <div className="mb-6">
              <label htmlFor="availability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                When are you available? * (Between {eventData?.windowStart && formatDateShort(eventData.windowStart)} and {eventData?.windowEnd && formatDateShort(eventData.windowEnd)})
              </label>
              <textarea
                id="availability"
                required
                rows={6}
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Describe your availability in your own words."
              />
            </div>

            {/* Examples */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                💡 Example responses:
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>• &quot;Weekday evenings after 7 PM, not available August 11-18&quot;</div>
                <div>• &quot;Ideally after 8pm because that&apos;s when my kids go to bed&quot;</div>
                <div>• &quot;I have a recurring meeting Friday at 2pm, but can move if necessary&quot;</div>
                <div>• &quot;Pretty flexible except can&apos;t do Friday evenings or weekends&quot;</div>
                <div>• &quot;Mornings work best, but Thursday afternoons are also possible&quot;</div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={submitting || !formData.name.trim() || !formData.availability.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 w-full md:w-auto"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit My Availability'
                )}
              </button>
              
              {(!formData.name.trim() || !formData.availability.trim()) && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Please fill in both your name and availability to continue
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 