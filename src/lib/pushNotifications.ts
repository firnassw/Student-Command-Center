import { supabase } from './supabase';

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

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported by the browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission for notifications not granted.');
      return false;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // TODO: Ganti dengan VAPID Public Key Anda yang asli
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BIzM_-M2w5L1pL1bH3_f1c5OQc_h-q3rY-6sZ_Yn_3c5L_M1_Pq3_1c5OQc_h-q3rY-6sZ_Yn_3c5L_M1_Pq3_c";

    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Ekstrak data langganan (endpoint, keys)
    const subscriptionData = JSON.parse(JSON.stringify(subscription));

    // Simpan ke database Supabase tabel push_subscriptions
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
        updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    if (error) {
      console.error('Gagal menyimpan push subscription ke database:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saat mendaftar Push Notification:', error);
    return false;
  }
}
