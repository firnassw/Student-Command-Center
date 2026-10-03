import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webPush from "npm:web-push";

const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const vapidSubject = "mailto:admin@scc.com";

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(new Date());
    let currentDayWIB = '';
    let currentHourWIB = '';
    let currentMinuteWIB = '';
    
    for (const part of parts) {
      if (part.type === 'weekday') currentDayWIB = part.value; 
      if (part.type === 'hour') currentHourWIB = part.value;
      if (part.type === 'minute') currentMinuteWIB = part.value;
    }

    const currentTimeStr = `${currentHourWIB}:${currentMinuteWIB}`;

    const now = new Date();
    const nowPlus15 = new Date(now.getTime() + 15 * 60000); 
    const formatter15 = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    const parts15 = formatter15.formatToParts(nowPlus15);
    let hour15 = '';
    let min15 = '';
    for (const part of parts15) {
      if (part.type === 'hour') hour15 = part.value;
      if (part.type === 'minute') min15 = part.value;
    }
    const timePlus15Str = `${hour15}:${min15}`;

    const dayMap: Record<string, number> = {
      'Senin': 1, 'Selasa': 2, 'Rabu': 3, 
      'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7,
      // Fallbacks just in case
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
    };
    const dayOfWeek = dayMap[currentDayWIB];

    console.log(`[INFO] Waktu Server (WIB): Hari ${currentDayWIB}, Jam ${currentTimeStr}`);
    console.log(`[INFO] Mencari jadwal untuk hari: ${dayOfWeek}, jam tepat: ${currentTimeStr}:00, persiapan: ${timePlus15Str}:00`);

    // Using explicitly appended :00 to match Postgres time strictly
    const exactCurrentTimeStr = `${currentTimeStr}:00`;
    const exactTimePlus15Str = `${timePlus15Str}:00`;

    const { data: schedules, error: scheduleError } = await supabaseClient
      .from('schedules')
      .select(`
        id,
        course_id,
        start_time,
        courses ( name, user_id, room )
      `)
      .eq('day_of_week', dayOfWeek)
      .in('start_time', [exactCurrentTimeStr, exactTimePlus15Str]);

    if (scheduleError) throw scheduleError;
    
    console.log(`[INFO] Ditemukan jadwal: ${schedules?.length || 0}`);
    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ message: "Tidak ada jadwal di menit ini" }), { status: 200 });
    }

    const notificationPromises = schedules.map(async (schedule) => {
      const isStartNow = schedule.start_time.startsWith(currentTimeStr); 
      const isStart15Min = schedule.start_time.startsWith(timePlus15Str);
      
      const userId = schedule.courses?.user_id;
      if (!userId) return;

      const { data: settings } = await supabaseClient
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!settings || !settings.attendance_enabled) return;
      if (isStartNow && !settings.at_start_enabled) return;
      if (isStart15Min && !settings.before_enabled) return;

      const courseName = schedule.courses?.name || "Mata Kuliah";
      const room = schedule.courses?.room || "Ruangan Online";
      const title = isStart15Min 
        ? `Siap-siap! Kelas ${courseName} dimulai 15 menit lagi.` 
        : `Kelas ${courseName} sudah dimulai!`;
      const body = isStart15Min 
        ? `Ruangan: ${room}. Jangan lupa absen sebentar lagi.` 
        : `Ruangan: ${room}. Klik di sini untuk mengonfirmasi kehadiranmu sekarang.`;
      
      const payload = JSON.stringify({
        title,
        body,
        icon: "/vite.svg",
        badge: "/vite.svg",
        url: `/schedules?course_id=${schedule.course_id}&action=attendance`, 
      });

      const { data: subscriptions } = await supabaseClient
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`[WARN] User ${userId} tidak memiliki push subscription.`);
        return;
      }

      const pushPromises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            }
          };

          await webPush.sendNotification(pushSubscription, payload);
          console.log(`[SUCCESS] Notifikasi sukses dikirim ke: ${userId}`);
        } catch (err: any) {
          console.error(`[ERROR] Gagal mengirim ke endpoint ${sub.endpoint}:`, err);
          if (err.statusCode === 410) {
            await supabaseClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      });

      await Promise.all(pushPromises);
    });

    await Promise.all(notificationPromises);

    return new Response(JSON.stringify({ success: true, message: "Pengecekan cron selesai" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
