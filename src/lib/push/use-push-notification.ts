"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);

    if (!supported) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);

    // Register service worker and check existing subscription
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(Boolean(sub));
      })
      .catch((err) => {
        console.warn("Service worker registration error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      if (!isSupported) {
        throw new Error("Push notifications are not supported on this browser or device.");
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BElNrhuquR0FZXojpE3Ae5B6YnuYHk8aINQZbdpC7G6UoAg4wdAAIzgxoXFbscSmN0ffqh3XAZWlOSN4xs_K1qI";

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // Send to server
      const res = await fetch("/api/admin/notifications/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || "Failed to register subscription on server.");
      }

      setIsSubscribed(true);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe to push notifications.";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/admin/notifications/push-subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unsubscribe.";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}
