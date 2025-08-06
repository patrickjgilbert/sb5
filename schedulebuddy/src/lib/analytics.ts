// lib/analytics.ts
declare global {
  interface Window {
    gtag: (...args: (string | object | Date)[]) => void;
  }
}

// GA4 Event Types
export interface GA4EventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, string | number | boolean>;
}

// Track GA4 Events
export const trackEvent = (
  eventName: string, 
  eventParams: GA4EventParams = {}
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Specific event trackers for ScheduleBuddy
export const trackAdminEventCreated = (eventId: string, eventName: string) => {
  trackEvent('admin_event_created', {
    event_category: 'Admin',
    event_label: eventName,
    custom_parameters: {
      event_id: eventId,
      event_name: eventName
    }
  });
};

export const trackUserFormSubmission = (eventId: string, participantName: string) => {
  trackEvent('user_form_submitted', {
    event_category: 'Participant',
    event_label: participantName,
    custom_parameters: {
      event_id: eventId,
      participant_name: participantName
    }
  });
};

export const trackPageView = (page_title: string, page_location: string) => {
  if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_title,
      page_location,
    });
  }
}; 