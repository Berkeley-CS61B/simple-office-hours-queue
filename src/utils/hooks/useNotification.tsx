/**
 * Hook to show a desktop notification.
 */
const useNotification = () => {
  /**
   *  Show a desktop notification.
   * @param message The message to show in the notification.
   * @param body The body of the notification.
   */
  const showNotification = (message?: string, body?: string, options?: NotificationOptions) => {
    const notification = new Notification(message ?? 'New Office Hours Notification', {
      body,
      icon: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
    };
  };

  return { showNotification };
};

export default useNotification;
