/**
 * Handle tab close detection for guest session cleanup.
 */
export const setupTabCloseHandler = (sessionId: string | null) => {
  if (!sessionId) return;
  
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    // Try to send cleanup request (may not always work due to browser limitations)
    try {
      // Use sendBeacon for reliable delivery even if page is closing
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      navigator.sendBeacon(
        `${apiUrl}/api/guest/cleanup/${sessionId}`,
        JSON.stringify({ session_id: sessionId })
      );
    } catch (error) {
      console.error('Failed to send cleanup request:', error);
    }
  };
  
  // Also handle visibility change (tab switch, minimize)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab is hidden, but don't cleanup yet (user might come back)
      // Only cleanup on actual close
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

