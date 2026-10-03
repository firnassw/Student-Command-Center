import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Utility to convert Base64 string to Uint8Array (required for VAPID key)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mengecek apakah browser sudah memiliki langganan push yang aktif
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setIsSubscribed(true);
          }
        } catch (err) {
          console.error("Gagal memeriksa status langganan push", err);
        }
      });
    }
  }, []);

  const subscribeToPush = async () => {
    setIsSubscribing(true);
    setError(null);
    
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Browser Anda tidak mendukung push notification.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Izin notifikasi tidak diberikan oleh pengguna.');
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID Public Key belum dikonfigurasi di .env');
      }

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User belum login.');

      const subscriptionData = JSON.parse(JSON.stringify(subscription));

      const { error: upsertError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
          updated_at: new Date().toISOString()
        }, { onConflict: 'endpoint' });

      if (upsertError) {
        throw new Error(`Gagal menyimpan ke database: ${upsertError.message}`);
      }

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      console.error('Error in subscribeToPush:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    subscribeToPush,
    isSubscribing,
    isSubscribed,
    error
  };
}
