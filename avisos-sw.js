self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));

self.addEventListener("push", event => {
  const prueba = event.data?.text() === "prueba";
  event.waitUntil(self.registration.showNotification(prueba ? "Grana Roja · Prueba" : "Grana Roja", {
    body: prueba ? "El aviso de prueba llegó a tu iPhone." : "🎁 Hay un regalo para ti en la cabaña",
    tag: prueba ? "grana-roja-prueba" : "grana-roja-regalo"
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
