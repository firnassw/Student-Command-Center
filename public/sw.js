self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: data.icon || '/vite.svg', // Fallback icon
        badge: data.badge || '/vite.svg',
        data: {
          url: data.url || '/'
        },
        vibrate: [200, 100, 200, 100, 200, 100, 200]
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (err) {
      console.error('Push event error:', err);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
