const webPush = require('web-push');

webPush.setVapidDetails(
  'mailto:admin@scc.com',
  'BO6xZY-3yXOl3drs6RJti1sdW6SnEvuvbnQvlGRSzbxj4qQbrL-rg_95jwB1Wvjsi973or4hjeVxGpkOM0J0fVo',
  'p3uWp2V_JBdZdpKtyONJnm23tACHi1_mF_lARZ9c-bs'
);

const pushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/dO7vl9O61Ao:APA91bGADdF1m_wiWmGda7Lv_5gRpui0EPUQGdSg-BRpPIohsLGtYnKpMSlvfh6npKLwV_UNZeVaXNf3Goy36Iu5ogVeuCyiDz6cklI0E_X_asie9s0DRz8VpixIubGDqObjJzlyyUW_',
  keys: {
    auth: 'dXCOQMukKaHl2Bno45eGuw',
    p256dh: 'BNKPbK0q_z0BIduXOiDuvlVGjLlu27UaX9C-al-9F0RGd_Q5ZJU8eGaJlvLwc1twIqbplwLRAyQYrhXB4-ZkC3Y'
  }
};

const payload = JSON.stringify({
  title: 'Test Notifikasi Berhasil! 🎉',
  body: 'Halo dari Antigravity! Sistem Pengingat Absen SCC Anda sudah aktif 100%.',
  icon: '/vite.svg',
  url: '/'
});

webPush.sendNotification(pushSubscription, payload)
  .then(() => console.log('Sukses mengirim notifikasi!'))
  .catch(err => console.error('Gagal mengirim:', err));
