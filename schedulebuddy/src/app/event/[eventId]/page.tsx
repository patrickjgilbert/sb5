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

interface AvailabilitySlot {
  date: string;
  timeSlots: string[];
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
    email: '',
    availabilities: [] as AvailabilitySlot[]
  });

  // Generate date range between windowStart and windowEnd
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

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

      // Generate available dates
      const dates = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      setAvailableDates(dates);
      setLoading(false);
    }, 1000);
  }, [eventId]);

  const handleDateToggle = (date: string) => {
    const newSelectedDates = new Set(selectedDates);
    if (newSelectedDates.has(date)) {
      newSelectedDates.delete(date);
    } else {
      newSelectedDates.add(date);
    }
    setSelectedDates(newSelectedDates);
  };

  const handleTimeSlotToggle = (date: string, timeSlot: string) => {
    const newAvailabilities = [...formData.availabilities];
    const dateIndex = newAvailabilities.findIndex(a => a.date === date);
    
    if (dateIndex === -1) {
      newAvailabilities.push({ date, timeSlots: [timeSlot] });
    } else {
      const existing = newAvailabilities[dateIndex];
      if (existing.timeSlots.includes(timeSlot)) {
        existing.timeSlots = existing.timeSlots.filter(t => t !== timeSlot);
        if (existing.timeSlots.length === 0) {
          newAvailabilities.splice(dateIndex, 1);
        }
      } else {
        existing.timeSlots.push(timeSlot);
      }
    }

    setFormData({ ...formData, availabilities: newAvailabilities });
  };

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
          email: formData.email,
          availabilities: formData.availabilities
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

  const isTimeSlotSelected = (date: string, timeSlot: string) => {
    const availability = formData.availabilities.find(a => a.date === date);
    return availability?.timeSlots.includes(timeSlot) || false;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            Available dates: {eventData?.windowStart} to {eventData?.windowEnd}
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
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
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>

            {/* Availability Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Select Your Availability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Click on the dates and times when you&apos;re available. You can select multiple time slots for each day.
              </p>

              <div className="space-y-6">
                {availableDates.map((date) => (
                  <div key={date} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {formatDate(date)}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleDateToggle(date)}
                        className={`text-sm px-3 py-1 rounded ${
                          selectedDates.has(date)
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}
                      >
                        {selectedDates.has(date) ? 'Clear All' : 'Select All'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {timeSlots.map((timeSlot) => (
                        <button
                          key={timeSlot}
                          type="button"
                          onClick={() => handleTimeSlotToggle(date, timeSlot)}
                          className={`px-3 py-2 text-sm rounded transition-colors ${
                            isTimeSlotSelected(date, timeSlot)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {timeSlot}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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
                disabled={submitting || formData.availabilities.length === 0}
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
                  `Submit Availability (${formData.availabilities.reduce((total, a) => total + a.timeSlots.length, 0)} slots selected)`
                )}
              </button>
              
              {formData.availabilities.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Please select at least one time slot to continue
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 