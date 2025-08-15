'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO, startOfWeek, endOfWeek } from 'date-fns';

interface AvailabilitySlot {
  time: string;
  confidence: 'high' | 'medium' | 'low';
  availableParticipants: string[];
  totalParticipants: number;
}

interface DayAvailability {
  date: string;
  slots: AvailabilitySlot[];
  hasFullAvailability: boolean;
  availabilityPercentage: number;
  availableParticipants?: string[];
  unavailableParticipants?: string[];
  totalParticipants?: number;
}

interface CalendarWidgetProps {
  eventData: {
    windowStart: string;
    windowEnd: string;
  };
  analysis?: {
    suggestions: Array<{
      date: string;
      time: string;
      confidence: string;
      notes: string;
    }>;
    dailyAvailability?: DayAvailability[];
  };
  onDateSelect?: (date: string, availability: DayAvailability) => void;
}

export default function CalendarWidget({ eventData, analysis, onDateSelect }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parse event window
  const windowStart = parseISO(eventData.windowStart);
  const windowEnd = parseISO(eventData.windowEnd);

  // Generate calendar days with proper week alignment
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get the start and end of the calendar grid (including leading/trailing days)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get availability for a specific date
  const getDateAvailability = (date: Date): DayAvailability | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return analysis?.dailyAvailability?.find(day => day.date === dateStr) || null;
  };

  // Check if date is within event window
  const isInEventWindow = (date: Date): boolean => {
    return date >= windowStart && date <= windowEnd;
  };

  // Get color for date based on availability
  const getDateColor = (date: Date): string => {
    // Dates outside current month
    if (!isSameMonth(date, currentMonth)) {
      return 'bg-gray-50 text-gray-300'; // Muted style for other month dates
    }

    // Dates outside event window
    if (!isInEventWindow(date)) {
      return 'bg-gray-100 text-gray-400'; // Outside window
    }

    const availability = getDateAvailability(date);
    if (!availability) {
      return 'bg-gray-50 text-gray-600 hover:bg-gray-100'; // No data
    }

    if (availability.hasFullAvailability) {
      return 'bg-green-500 text-white hover:bg-green-600'; // Full availability
    }

    if (availability.availabilityPercentage >= 75) {
      return 'bg-green-300 text-green-900 hover:bg-green-400'; // High availability
    }

    if (availability.availabilityPercentage >= 50) {
      return 'bg-yellow-300 text-yellow-900 hover:bg-yellow-400'; // Medium availability
    }

    if (availability.availabilityPercentage >= 25) {
      return 'bg-orange-300 text-orange-900 hover:bg-orange-400'; // Low availability
    }

    return 'bg-red-300 text-red-900 hover:bg-red-400'; // Very low availability
  };

  // Handle date click/hover
  const handleDateInteraction = (date: Date, isClick: boolean = false) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availability = getDateAvailability(date);

    // Don't allow interaction with dates outside current month or event window
    if (!isSameMonth(date, currentMonth) || !availability || !isInEventWindow(date)) return;

    if (isClick || isMobile) {
      setSelectedDate(selectedDate === dateStr ? null : dateStr);
      onDateSelect?.(dateStr, availability);
    } else {
      setHoveredDate(dateStr);
    }
  };

  // Check if date is a suggested meeting time
  const isSuggestedDate = (date: Date): boolean => {
    // Only show suggestions for dates in current month and within event window
    if (!isSameMonth(date, currentMonth) || !isInEventWindow(date)) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return analysis?.suggestions?.some(suggestion => {
      // Handle both formatted dates (e.g., "Wednesday, July 30th") and ISO dates
      return suggestion.date.includes(dateStr) || 
             (suggestion.date.includes(format(date, 'MMMM')) && 
              suggestion.date.includes(date.getDate().toString()));
    }) || false;
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          📅 Availability Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <span className="font-medium min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Legend:</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>100% Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            <span>75%+ Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
            <span>50%+ Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-300 rounded"></div>
            <span>25%+ Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span>Limited</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const availability = getDateAvailability(date);
          const isSelected = selectedDate === dateStr;
          const isHovered = hoveredDate === dateStr;
          const isSuggested = isSuggestedDate(date);
          const inWindow = isInEventWindow(date);
          const inCurrentMonth = isSameMonth(date, currentMonth);
          const canInteract = inCurrentMonth && inWindow && getDateAvailability(date);

          return (
            <div
              key={dateStr}
              className={`
                relative h-12 rounded-lg transition-all duration-200 flex items-center justify-center text-sm font-medium border-2
                ${getDateColor(date)}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${isHovered && !isSelected ? 'ring-1 ring-gray-400' : ''}
                ${isSuggested ? 'border-purple-500 border-2' : 'border-transparent'}
                ${canInteract ? 'cursor-pointer' : 'cursor-default'}
              `}
              onClick={() => handleDateInteraction(date, true)}
              onMouseEnter={() => !isMobile && handleDateInteraction(date, false)}
              onMouseLeave={() => !isMobile && setHoveredDate(null)}
            >
              <span>
                {format(date, 'd')}
              </span>
              
              {/* Today indicator */}
              {isToday(date) && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
              
              {/* Suggested meeting indicator */}
              {isSuggested && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full"></div>
              )}
              
              {/* Availability dots */}
              {inCurrentMonth && availability && availability.slots.length > 0 && (
                <div className="absolute bottom-1 right-1 flex gap-1">
                  {availability.slots.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                  ))}
                  {availability.slots.length > 3 && (
                    <span className="text-xs opacity-80">+</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected date details */}
      {selectedDate && (() => {
        const availability = analysis?.dailyAvailability?.find(day => day.date === selectedDate);
        if (!availability) return null;

        const hasParticipantData = availability.availableParticipants || availability.unavailableParticipants;

        return (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">
              {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            </h4>
            
            {availability.hasFullAvailability && (
              <div className="mb-3 p-2 bg-green-100 rounded text-green-800 text-sm">
                🎉 Perfect! All participants are available on this date.
              </div>
            )}
            
            <div className="space-y-4">
              <div className="text-sm text-blue-800">
                <strong>Overall Availability:</strong> {Math.round(availability.availabilityPercentage)}% of participants
                {availability.totalParticipants && (
                  <span className="text-blue-600 ml-1">
                    ({(availability.availableParticipants?.length || 0)} of {availability.totalParticipants})
                  </span>
                )}
              </div>

              {/* Participant breakdown */}
              {hasParticipantData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Available participants */}
                  {availability.availableParticipants && availability.availableParticipants.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <h5 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                        ✅ Available ({availability.availableParticipants.length})
                      </h5>
                      <div className="space-y-1">
                        {availability.availableParticipants.map((name, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-medium">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-green-800">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unavailable participants */}
                  {availability.unavailableParticipants && availability.unavailableParticipants.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <h5 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                        ❌ Unavailable ({availability.unavailableParticipants.length})
                      </h5>
                      <div className="space-y-1">
                        {availability.unavailableParticipants.map((name, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-700 text-xs font-medium">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-red-800">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Time slots (if available) */}
              {availability.slots.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">Available Time Slots:</p>
                  <div className="space-y-1">
                    {availability.slots.map((slot, index) => (
                      <div key={index} className="text-sm bg-white rounded p-2 border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{slot.time}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            slot.confidence === 'high' ? 'bg-green-100 text-green-800' :
                            slot.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {slot.confidence} confidence
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {slot.availableParticipants.length} of {slot.totalParticipants} participants available
                        </p>
                        {slot.availableParticipants.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Available: {slot.availableParticipants.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback message when no detailed data is available */}
              {!hasParticipantData && availability.slots.length === 0 && (
                <div className="text-sm text-gray-600 italic bg-gray-50 rounded p-3">
                  💡 Detailed participant information will be available after running AI analysis with participant responses.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {isMobile ? 'Tap a date to see available times' : 'Hover over or click a date to see available times'} • 
        Purple dots indicate AI-suggested meeting times
      </div>
    </div>
  );
} 