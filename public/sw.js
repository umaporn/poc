self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  console.log("Push received:", data);

  event.waitUntil(
    (async () => {
      const result = await self.registration.showNotification(
        data.title || "Hello!",
        {
          body: data.body || "You have a new notification.",
          icon: "/icon.png",
        }
      );
      console.log("Notification shown:", result);
    })()
  );
});