'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getRecentEvents, type RecentEvent } from '@/lib/localStorage';

export default function Home() {
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);

  useEffect(() => {
    setRecentEvents(getRecentEvents());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Schedule<span className="text-blue-600">Buddy</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            The smart way to coordinate events and meetings. Collect availability from everyone and get AI-powered recommendations for the best meeting times.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              Create New Event
            </Link>
            <a
              href="#how-it-works"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Your Recent Events
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {event.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {event.description || 'No description'}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={event.adminUrl}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Admin Dashboard →
                    </Link>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Created {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div id="how-it-works" className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-300 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create Your Event
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Set up your event details, date range, and get shareable links instantly.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-300 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Collect Availability
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Share the participant link with your group and let everyone submit their availability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 dark:text-purple-300 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get AI Recommendations
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Let AI analyze everyone&apos;s schedules and suggest the best meeting times.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Why Choose ScheduleBuddy?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🤖 AI-Powered Scheduling
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our intelligent algorithm analyzes everyone&apos;s availability and suggests optimal meeting times that work for the most people.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📱 Easy to Use
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simple, intuitive interface that works on any device. No account creation required for participants.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ⚡ Lightning Fast
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create events in seconds and get instant shareable links. No complex setup or configuration needed.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📊 Real-time Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track responses in real-time with a comprehensive admin dashboard showing all submissions and analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Beyond Simple &quot;Yes&quot; or &quot;No&quot; Scheduling
            </h2>
            
            <div className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-6">
              <p>
                <strong className="text-gray-900 dark:text-white">Modern life is chaotic, but flexible.</strong> We&apos;re all busier than ever, yet we have more inherent flexibility than traditional scheduling tools can capture. Your calendar might be packed, but you know that certain meetings can be rescheduled, your spouse can handle pickup duty, or you could join virtually if needed.
              </p>
              
              <p>
                Gone are the days where you can simply say &quot;yes&quot; or &quot;no&quot; to most time slots. Today&apos;s reality includes timezone juggling, personal commitments, recurring meetings that could be moved, and a thousand little preferences that matter when finding the perfect time for everyone.
              </p>
              
              <p>
                <strong className="text-blue-600">ScheduleBuddy embraces this complexity.</strong> Our AI-powered natural language approach lets participants share their real availability: <em>&quot;Evenings work best, but I can do mornings if it&apos;s important&quot;</em> or <em>&quot;I have a recurring call Fridays at 2pm, but it can be moved for this.&quot;</em>
              </p>
              
              <p className="text-center bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <strong className="text-blue-900 dark:text-blue-100">
                  We encourage honesty and nuance, because the right time for your event is one that truly works for everyone.
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center text-lg"
          >
            Get Started - Create Your First Event
          </Link>
        </div>
      </div>
    </div>
  );
}
