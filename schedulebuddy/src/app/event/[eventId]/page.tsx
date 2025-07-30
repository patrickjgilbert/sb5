'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

  // Simulated data for now - in a real app this would come from your API/database
  useEffect(() => {
    setTimeout(() => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);

      setEventData({
        id: eventId,
        name: 'Team Meeting',
        description: 'Weekly team sync to discuss project updates and plan next steps',
        windowStart: startDate.toISOString().split('T')[0],
        windowEnd: endDate.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 1000);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Thank You!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your availability has been submitted successfully. The organizer will review all responses and get back to you with the best meeting times.
          </p>
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
            Scheduling window: {eventData?.windowStart && formatDate(eventData.windowStart)} to {eventData?.windowEnd && formatDate(eventData.windowEnd)}
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📝 How This Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>Enter your name and describe when you&apos;re available</li>
            <li>Use natural language - be as specific or general as you like</li>
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
                When are you available? *
              </label>
              <textarea
                id="availability"
                required
                rows={6}
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Describe your availability in your own words. For example:&#10;&#10;• Weekday evenings after 6 PM&#10;• Not available August 11-18 (vacation)&#10;• Prefer mornings on weekends&#10;• Free most afternoons except Fridays&#10;• Any time works except Thursday evenings"
              />
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <strong>Tips:</strong> Be as specific or general as you like. Mention preferred times, days to avoid, 
                time zones if relevant, or any other scheduling preferences.
              </div>
            </div>

            {/* Examples */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                💡 Example responses:
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>• &quot;Weekday evenings after 7 PM, not available August 11-18&quot;</div>
                <div>• &quot;Mornings work best, prefer before 11 AM on weekdays&quot;</div>
                <div>• &quot;Pretty flexible except can&apos;t do Friday evenings or weekends&quot;</div>
                <div>• &quot;Available most afternoons, prefer 2-5 PM slot if possible&quot;</div>
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