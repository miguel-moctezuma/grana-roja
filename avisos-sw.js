self.addEventListener("push", event => {
  event.waitUntil(self.registration.showNotification("Grana Roja", {
    body: "🎁 Hay un regalo para ti en la cabaña",
    tag: "grana-roja-regalo"
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({type: "window", includeUncontrolled: true}).then(ventanas => {
      const ventana = ventanas.find(cliente => cliente.url.startsWith(self.registration.scope));
      return ventana ? ventana.focus() : self.clients.openWindow(self.registration.scope);
    })
  );
});
