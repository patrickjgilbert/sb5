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

        {/* Brand Philosophy Section - Full Width */}
        <div className="w-full bg-gray-100 dark:bg-gray-900 py-16 md:py-24 mt-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              
              {/* Main Headline */}
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                  &quot;Yes&quot; or &quot;no&quot; was never enough.
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Modern life is chaotic, but flexible. We&apos;re all busier than ever, yet we have more nuanced availability than traditional scheduling tools can capture.
                </p>
              </div>

              {/* Side-by-side Comparison */}
              <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
                
                {/* Traditional Scheduling */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-8 border-l-4 border-red-400">
                  <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4 flex items-center">
                    <span className="mr-3">❌</span>
                    Traditional Scheduling
                  </h3>
                  <div className="space-y-4 text-red-700 dark:text-red-300">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                      <p className="font-medium mb-2">Tuesday 2:00 PM</p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-200 text-green-800 rounded text-sm">Available</button>
                        <button className="px-3 py-1 bg-red-200 text-red-800 rounded text-sm">Busy</button>
                      </div>
                    </div>
                    <p className="text-sm italic">
                      &quot;I&apos;m marked as &apos;busy&apos; but I could actually move that meeting if this is important...&quot;
                    </p>
                  </div>
                </div>

                {/* ScheduleBuddy Approach */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 border-l-4 border-blue-400">
                  <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                    <span className="mr-3">✨</span>
                    ScheduleBuddy
                  </h3>
                  <div className="space-y-4 text-blue-700 dark:text-blue-300">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                      <p className="font-medium mb-2">Your availability:</p>
                      <textarea 
                        className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200" 
                        rows={3} 
                        readOnly 
                        value="Evenings work best, but I can do mornings if it's critical. I have a recurring call Fridays at 2pm, but it can be moved for this."
                      />
                    </div>
                    <p className="text-sm italic">
                      &quot;Finally, I can share my real availability with all the context that matters!&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Stylized Quotes */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="text-4xl mb-4">💬</div>
                  <blockquote className="text-gray-700 dark:text-gray-300 italic">
                    &quot;Weekday evenings after 6 PM work best, but I could do lunch if it&apos;s the only option&quot;
                  </blockquote>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🌍</div>
                  <blockquote className="text-gray-700 dark:text-gray-300 italic">
                    &quot;I&apos;m in London so early mornings your time work great for me, just not Fridays&quot;
                  </blockquote>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
                  <blockquote className="text-gray-700 dark:text-gray-300 italic">
                    &quot;Ideally after 8pm when the kids are in bed, but my spouse can cover if it&apos;s urgent&quot;
                  </blockquote>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  We embrace complexity, because real life is complex.
                </h3>
                <p className="text-lg mb-6 opacity-90">
                  The right time for your event is one that truly works for everyone — not just the first available slot.
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Start Scheduling Smarter
                </Link>
              </div>

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
