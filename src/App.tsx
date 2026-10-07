import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Schedules from './components/Schedules';
import Tasks from './components/Tasks';
import TaskDetail from './components/TaskDetail';
import Courses from './components/Courses';
import CourseDetail from './components/CourseDetail';
import Projects from './components/Projects';
import AddProject from './components/AddProject';
import AddProjectTask from './components/AddProjectTask';
import ProjectDetail from './components/ProjectDetail';

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [skippedNotif, setSkippedNotif] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkNotifStatus(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkNotifStatus(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkNotifStatus = (currentSession: any) => {
    if (currentSession && 'Notification' in window && Notification.permission === 'default' && !skippedNotif) {
      setShowNotifPrompt(true);
    } else {
      setShowNotifPrompt(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleRequestNotif = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // NOTE: Replace this with your actual VAPID Public Key
        const publicVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBtc3sOEwV9Zp4Qe71I88g0B4'; 
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        const subObj = JSON.parse(JSON.stringify(subscription));
        
        if (session?.user?.id) {
          await supabase.from('push_subscriptions').insert({
            user_id: session.user.id,
            endpoint: subObj.endpoint,
            p256dh: subObj.keys.p256dh,
            auth: subObj.keys.auth,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error('Error enabling push:', e);
    } finally {
      setShowNotifPrompt(false);
      setSkippedNotif(true);
    }
  };

  const handleSkipNotif = () => {
    setShowNotifPrompt(false);
    setSkippedNotif(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) setError(error.message);
      else setError("Check your email for the login link!");
    }
    setLoading(false);
  };

  if (!session) {
    if (isLogin) {
      return (
        <div className="bg-surface-container-low min-h-screen flex flex-col items-center md:justify-center antialiased">
          <div className="w-full max-w-[390px] md:max-w-md min-h-screen md:min-h-[650px] md:h-auto bg-surface-container-lowest text-on-surface flex flex-col items-center justify-center p-lg relative md:shadow-2xl md:rounded-2xl md:my-8 border border-muted-divider/30 md:border-none">
            <main className="w-full flex-1 flex flex-col justify-center space-y-xl mt-8 md:mt-0">
              {/* Header Section */}
              <header className="flex flex-col space-y-md">
                <div className="w-12 h-12 bg-ink-on-dark rounded-badge flex items-center justify-center rounded-2xl">
                  <span className="material-symbols-outlined text-on-primary text-2xl" data-icon="school" data-weight="regular">school</span>
                </div>
                <div className="space-y-xs pt-sm">
                  <h1 className="font-h1-mobile text-h1-mobile text-primary">Selamat datang</h1>
                  <p className="font-body text-body text-primary">Masuk untuk mengatur kuliahmu hari ini.</p>
                </div>
              </header>
              
              {/* Form Section */}
              <form className="space-y-base w-full flex flex-col" onSubmit={handleSubmit}>
                <div className="space-y-xs">
                  <label className="block font-label-medium text-label-medium text-on-surface" htmlFor="email">Email</label>
                  <input className="w-full px-base py-3 border border-muted-divider rounded-2xl font-body text-body text-on-surface bg-surface-container-lowest placeholder:text-on-surface-variant transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" id="email" name="email" placeholder="nama@kampus.ac.id" required type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                
                <div className="space-y-xs">
                  <label className="block font-label-medium text-label-medium text-on-surface" htmlFor="password">Password</label>
                  <div className="relative flex items-center">
                    <input className="w-full px-base py-3 border border-muted-divider rounded-2xl font-body text-body text-on-surface bg-surface-container-lowest placeholder:text-on-surface-variant pr-12 transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" id="password" name="password" placeholder="••••••••" required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} />
                    <button aria-label="Toggle password visibility" className="absolute right-base text-on-surface-variant hover:text-on-surface focus:outline-none flex items-center justify-center" type="button" onClick={() => setShowPassword(!showPassword)}>
                      <span className="material-symbols-outlined" data-icon="visibility" data-weight="regular">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                
                {error && <div className="text-error font-body text-sm mt-2">{error}</div>}
                
                <div className="pt-sm w-full">
                  <button className="w-full py-4 bg-ink-on-dark text-on-primary rounded-full font-h2 text-h2 uppercase tracking-wide hover:opacity-90 active:scale-95 transition-all flex justify-center items-center" type="submit" disabled={loading}>
                    {loading ? 'MEMPROSES...' : 'MASUK'}
                  </button>
                </div>
              </form>
              
              {/* Secondary Action */}
              <div className="text-center w-full">
                <a className="font-body text-body text-on-surface hover:text-on-surface-variant transition-colors cursor-pointer" onClick={() => setIsLogin(false)}>
                  Belum punya akun? <span className="font-semibold underline decoration-1 underline-offset-4">Daftar</span>
                </a>
              </div>
            </main>
            
            <footer className="w-full text-center py-lg mt-auto">
              <p className="font-metadata text-metadata text-on-surface-variant">Student Command Center · Personal academic workspace</p>
            </footer>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-surface-container-low min-h-screen flex flex-col items-center md:justify-center antialiased">
        <div className="w-full max-w-[390px] md:max-w-md min-h-screen md:min-h-[650px] md:h-auto bg-white flex flex-col relative overflow-hidden md:shadow-2xl md:rounded-2xl md:my-8">
          <header className="w-full top-0 sticky bg-background dark:bg-ink-on-dark flex items-center justify-between px-lg py-md max-w-screen-xl mx-auto z-10">
            <button className="active:scale-95 transition-transform duration-200 text-primary dark:text-on-primary hover:opacity-80 flex items-center justify-center p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20">
              <span aria-hidden="true" className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
            </button>
            <div className="font-h1-mobile text-h1-mobile font-bold text-tertiary dark:text-on-tertiary truncate px-2">
              Student Command Center
            </div>
            <div className="w-10"></div>
          </header>

          <main className="flex-grow flex flex-col px-6 pt-xl pb-lg overflow-y-auto">
            <div className="mb-xl">
              <h1 className="font-h1 text-h1 text-primary mb-2">Buat akun</h1>
              <p className="font-body text-body text-on-surface-variant">Mulai pusat kendali akademikmu.</p>
            </div>
            
            <form className="flex flex-col gap-base flex-grow" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-medium text-label-medium text-primary ml-1" htmlFor="nama">Nama</label>
                <input className="w-full bg-white border border-muted-divider rounded-2xl px-4 py-3 font-body text-body text-primary placeholder:text-on-tertiary-container focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" id="nama" name="nama" placeholder="Masukkan nama" type="text" value={name} onChange={e => setName(e.target.value)} />
              </div>
              
              <div className="flex flex-col gap-xs">
                <label className="font-label-medium text-label-medium text-primary ml-1" htmlFor="email">Email</label>
                <input className="w-full bg-white border border-muted-divider rounded-2xl px-4 py-3 font-body text-body text-primary placeholder:text-on-tertiary-container focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" id="email" name="email" placeholder="Masukkan email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-medium text-label-medium text-primary ml-1" htmlFor="password">Password</label>
                <div className="relative">
                  <input className="w-full bg-white border border-muted-divider rounded-2xl px-4 py-3 pr-12 font-body text-body text-primary placeholder:text-on-tertiary-container focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" id="password" name="password" placeholder="Masukkan password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-tertiary-container hover:text-primary transition-colors focus:outline-none flex items-center justify-center p-1 rounded-full" type="button" onClick={() => setShowPassword(!showPassword)}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[20px]" data-icon={showPassword ? "visibility_off" : "visibility"}>{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {error && <div className="text-error font-body text-sm mt-2">{error}</div>}

              <div className="mt-xl flex flex-col gap-6 items-center">
                <button className="w-full bg-ink-on-dark text-on-tertiary font-h2 text-h2 py-4 rounded-full active:scale-95 transition-transform duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-ink-on-dark/20 focus:ring-offset-2" type="submit" disabled={loading}>
                  {loading ? 'MEMPROSES...' : 'BUAT AKUN'}
                </button>
                <a className="font-label-medium text-label-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer" onClick={() => setIsLogin(true)}>
                  Sudah punya akun? <span className="font-semibold text-primary underline decoration-muted-divider underline-offset-4">Masuk</span>
                </a>
              </div>
            </form>
          </main>
          
          <footer className="w-full pb-8 pt-4 px-6 text-center">
            <p className="font-metadata text-metadata text-on-tertiary-container">
              Student Command Center · Personal academic workspace
            </p>
          </footer>
        </div>
      </div>
    );
  }
  if (showNotifPrompt) {
    return (
      <div className="bg-surface-container-low min-h-screen flex flex-col items-center md:justify-center antialiased">
        <div className="w-full max-w-[390px] md:max-w-md min-h-screen md:min-h-[650px] md:h-auto bg-surface-container-lowest flex flex-col items-center justify-between px-lg py-xl font-body text-on-surface md:shadow-2xl md:rounded-2xl md:my-8 border border-surface-variant relative select-none overflow-hidden">
          <div className="h-xl"></div>
          
          <main className="flex flex-col items-center w-full max-w-sm text-center flex-grow justify-center space-y-8 z-10">
            <div className="w-14 h-14 bg-ink-on-dark rounded-[16px] flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-surface-container-lowest text-3xl" data-icon="notifications">notifications</span>
            </div>
            
            <div className="space-y-4 px-sm">
              <h1 className="font-h1-mobile text-h1-mobile text-ink-on-dark tracking-tight">Aktifkan notifikasi</h1>
              <p className="font-body text-body text-on-surface-variant leading-relaxed px-4">
                  Dapatkan pengingat absensi 15 menit sebelum kelas dan saat kelas dimulai.
              </p>
            </div>
          </main>
          
          <div className="w-full max-w-sm flex flex-col items-center space-y-6 pb-xl z-10">
            <button 
              onClick={handleRequestNotif}
              className="w-full bg-ink-on-dark text-on-primary font-label-medium text-label-medium py-4 px-6 rounded-full hover:bg-opacity-90 active:scale-[0.98] transition-all duration-200 uppercase tracking-wider font-semibold shadow-sm"
            >
              IZINKAN NOTIFIKASI
            </button>
            <button 
              onClick={handleSkipNotif}
              className="text-on-surface-variant font-label-medium text-label-medium py-2 px-4 rounded-full hover:bg-surface-container-low transition-colors duration-200"
            >
              Nanti saja
            </button>
            <p className="font-metadata text-metadata text-muted-divider text-center px-lg pt-4 max-w-[280px]">
              Notifikasi adalah fitur penting agar kamu tidak lupa absen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleNav = (v: 'home' | 'schedules' | 'tasks') => {
    navigate(v === 'home' ? '/' : '/' + v);
  };

  return (
    <Routes>
      <Route path="/" element={<Dashboard setActiveView={handleNav} />} />
      <Route path="/schedules" element={<Schedules setActiveView={handleNav} />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/tasks/:id" element={<TaskDetail />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/add" element={<AddProject />} />
      <Route path="/projects/:projectId" element={<ProjectDetail />} />
      <Route path="/projects/:projectId/tasks/add" element={<AddProjectTask />} />
    </Routes>
  );
}

export default App;
