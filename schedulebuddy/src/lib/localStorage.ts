// Utility functions for managing recent events in localStorage

export interface RecentEvent {
  id: string;
  name: string;
  description?: string;
  windowStart?: string;
  windowEnd?: string;
  createdAt: string;
  adminUrl: string;
}

const STORAGE_KEY = 'schedulebuddy_recent_events';
const MAX_RECENT_EVENTS = 5;

export const addRecentEvent = (event: RecentEvent): void => {
  if (typeof window === 'undefined') return; // SSR safety
  
  try {
    const existing = getRecentEvents();
    
    // Remove if already exists (to move to top)
    const filtered = existing.filter(e => e.id !== event.id);
    
    // Add to beginning and limit to max
    const updated = [event, ...filtered].slice(0, MAX_RECENT_EVENTS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save recent event:', error);
  }
};

export const getRecentEvents = (): RecentEvent[] => {
  if (typeof window === 'undefined') return []; // SSR safety
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const events = stored ? JSON.parse(stored) : [];
    
    // Normalize admin URLs to relative paths for domain compatibility
    return events.map((event: RecentEvent) => ({
      ...event,
      adminUrl: normalizeAdminUrl(event.adminUrl)
    }));
  } catch (error) {
    console.warn('Failed to load recent events:', error);
    return [];
  }
};

// Helper function to convert absolute URLs to relative paths
const normalizeAdminUrl = (adminUrl: string): string => {
  try {
    // If it's already a relative path, return as-is
    if (adminUrl.startsWith('/')) {
      return adminUrl;
    }
    
    // If it's an absolute URL, extract the path
    const url = new URL(adminUrl);
    return url.pathname;
  } catch {
    // If URL parsing fails, assume it's already relative
    return adminUrl;
  }
};

export const removeRecentEvent = (eventId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getRecentEvents();
    const filtered = existing.filter(e => e.id !== eventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('Failed to remove recent event:', error);
  }
};

export const clearRecentEvents = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear recent events:', error);
  }
}; 