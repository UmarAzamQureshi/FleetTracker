import { useState, useEffect } from 'react'
import { Truck, MapPin, BarChart3, Bell, Shield, Zap, Clock, ChevronRight, Play, CheckCircle2, Star, TrendingUp } from 'lucide-react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const features = [
    { icon: <MapPin className="w-7 h-7" />, title: 'Real-Time Tracking', desc: 'Monitor your entire fleet in real-time with precise GPS updates.' },
    { icon: <BarChart3 className="w-7 h-7" />, title: 'Analytics Dashboard', desc: 'Actionable insights for fuel, drivers, and operations.' },
    { icon: <Bell className="w-7 h-7" />, title: 'Instant Alerts', desc: 'Notifications for speeding, maintenance and unauthorized stops.' },
    { icon: <Shield className="w-7 h-7" />, title: 'Enhanced Security', desc: 'Geofencing, anti‑theft protection and emergency response.' },
    { icon: <Zap className="w-7 h-7" />, title: 'Route Optimization', desc: 'Reduce fuel costs and improve delivery times with smarter routes.' },
    { icon: <Clock className="w-7 h-7" />, title: 'Maintenance Tracking', desc: 'Automated reminders to keep vehicles in optimal condition.' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="fixed top-0 left-0 right-0 h-16 z-10 transition-colors" style={{ backgroundColor: scrollY > 8 ? 'rgba(17,24,39,0.85)' : 'transparent', backdropFilter: scrollY > 8 ? 'blur(6px)' : 'none', borderBottom: scrollY > 8 ? '1px solid rgba(75,85,99,0.4)' : 'none' }} />

      {/* Hero */}
      <section className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Now with AI‑Powered Analytics</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white">
              Track Your Fleet in <span className="text-blue-400">Real‑Time</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-xl">
              Monitor vehicles, optimize routes, and reduce costs with our modern tracking platform.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href="/dashboard" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition">
                Go to Dashboard <ChevronRight className="w-5 h-5 ml-1" />
              </a>
              <a href="/reports" className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-gray-600 text-gray-100 hover:bg-gray-800 transition">
                <Play className="w-5 h-5 mr-2" /> View Reports
              </a>
            </div>
            <div className="mt-6 flex items-center gap-6">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/40" />
                ))}
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-400">Trusted by fleet managers worldwide</p>
              </div>
            </div>
          </div>
          <div>
            <div className="relative bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
              <div className="absolute -top-4 -right-4 bg-blue-600 rounded-xl px-4 py-3 shadow">
                <div className="text-2xl font-bold text-white">128</div>
                <div className="text-xs text-blue-100">Active Vehicles</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-500/80 rounded-xl px-4 py-3 shadow">
                <div className="text-2xl font-bold text-white">99.8%</div>
                <div className="text-xs text-blue-50">Accuracy</div>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-700">
                <div className="aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Truck className="w-24 h-24 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { v: '10K+', l: 'Active Vehicles' },
              { v: '500+', l: 'Companies' },
              { v: '99.9%', l: 'Uptime' },
              { v: '24/7', l: 'Support' },
            ].map((s, i) => (
              <div key={i} className="text-center bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                <div className="text-3xl font-bold text-blue-400">{s.v}</div>
                <div className="text-gray-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold">Everything you need to <span className="text-blue-400">manage your fleet</span></h2>
            <p className="text-lg text-gray-300 mt-3">Powerful features designed for visibility and control.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-900/20 transition h-full">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini live tracking bullets */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center mb-3">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Live GPS Tracking</h3>
            <p className="text-gray-300 text-sm">Track every vehicle with high accuracy.</p>
          </div>
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Route History</h3>
            <p className="text-gray-300 text-sm">Review complete journeys and stops.</p>
          </div>
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Instant Alerts</h3>
            <p className="text-gray-300 text-sm">Get notified about unusual activity.</p>
          </div>
        </div>
      </section>
    </div>
  )
}


