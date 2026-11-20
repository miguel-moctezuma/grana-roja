// Retira las suscripciones creadas por versiones anteriores del sitio.
self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    try {
      const suscripcion = await self.registration.pushManager.getSubscription();
      if (suscripcion) await suscripcion.unsubscribe();
    } finally {
      await self.registration.unregister();
    }
  })());
});
