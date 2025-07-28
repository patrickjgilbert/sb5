'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addRecentEvent } from '@/lib/localStorage';

export default function CreateEvent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    windowStart: '',
    windowEnd: ''
  });

  // Set default dates (today to 30 days from now)
  useState(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    setFormData(prev => ({
      ...prev,
      windowStart: today.toISOString().split('T')[0],
      windowEnd: thirtyDaysFromNow.toISOString().split('T')[0]
    }));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const result = await response.json();
      
      // Save to recent events
      addRecentEvent({
        id: result.eventId,
        name: formData.eventName,
        description: formData.description,
        createdAt: new Date().toISOString(),
        adminUrl: result.adminUrl
      });
      
      // Redirect to admin page with success state
      router.push(`/admin/${result.eventId}?created=true`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Set up your scheduling event and get a shareable link for participants
          </p>
        </div>

        {/* Information Card */}
        <div className="max-w-2xl mx-auto mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
            ✨ How It Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-green-800 dark:text-green-200 text-sm">
            <li>Fill out your event details below</li>
            <li>Get instant admin dashboard and participant form links</li>
            <li>Share the participant link with your friends</li>
            <li>Collect responses and get AI-powered meeting recommendations</li>
          </ol>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {/* Event Name */}
            <div className="mb-6">
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                required
                value={formData.eventName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Team Meeting, Fantasy Football Draft"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Add any additional details about your event..."
              />
            </div>

            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <label htmlFor="windowStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available From *
                </label>
                <input
                  type="date"
                  id="windowStart"
                  name="windowStart"
                  required
                  value={formData.windowStart}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="windowEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Until *
                </label>
                <input
                  type="date"
                  id="windowEnd"
                  name="windowEnd"
                  required
                  value={formData.windowEnd}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Event...
                </span>
              ) : (
                'Create Event'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 