// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: data.url || '/',
      habitId: data.habitId
    },
    actions: [
      {
        action: 'complete',
        title: 'Complete Habit'
      },
      {
        action: 'snooze',
        title: 'Snooze'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'complete') {
    // Handle completing the habit
    const habitId = event.notification.data.habitId;
    
    event.waitUntil(
      fetch('/api/habits/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId }),
      })
      .then(() => {
        return clients.openWindow('/dashboard');
      })
    );
  } else if (event.action === 'snooze') {
    // Handle snoozing the reminder (will re-notify in 15 minutes)
    const habitId = event.notification.data.habitId;
    
    event.waitUntil(
      fetch('/api/reminders/snooze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId, snoozeMinutes: 15 }),
      })
    );
  } else {
    // Open the app if notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          // If so, just focus it.
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
