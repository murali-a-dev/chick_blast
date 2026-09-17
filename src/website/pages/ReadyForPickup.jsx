import { useState, useEffect, useRef, useCallback } from 'react'
import moment from 'moment'
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Clock,
  User,
  PackageCheck,
} from 'lucide-react'
import { readyForPickupApi } from '../../shared/api'
import logoImg from '../../assets/logo.png'

// Sound chime synthesizer using native Web Audio API (no external asset required)
function playPickupChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.15) // A5

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880.0, now + 0.15)
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35) // D6

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now + 0.15)
    osc1.stop(now + 0.4)
    osc2.stop(now + 0.8)
  } catch {
    // Audio autoplay restrictions or unsupported
  }
}

export default function ReadyForPickup() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => moment().format('hh:mm:ss A'))
  const [refreshing, setRefreshing] = useState(false)
  const knownOrderIdsRef = useRef(new Set())
  const hasInitializedRef = useRef(false)

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format('hh:mm:ss A'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch packed orders from dedicated /api/ready_for_pickup endpoint
  const fetchPackedOrders = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const data = await readyForPickupApi.getOrders()
      const list = Array.isArray(data) ? data : []

      // Filter for only packed orders just in case
      const packedList = list.filter((o) => (o.status || '').toLowerCase() === 'packed')

      // Detect newly packed orders for audio chime
      if (hasInitializedRef.current && soundEnabled) {
        const newlyAdded = packedList.some((o) => !knownOrderIdsRef.current.has(o.id))
        if (newlyAdded) {
          playPickupChime()
        }
      }

      knownOrderIdsRef.current = new Set(packedList.map((o) => o.id))
      hasInitializedRef.current = true
      setOrders(packedList)
    } catch (err) {
      console.error('Failed to load packed orders:', err.message)
    } finally {
      if (isManual) setRefreshing(false)
      setLoading(false)
    }
  }, [soundEnabled])

  // Initial fetch and polling every 4 seconds
  useEffect(() => {
    let isMounted = true
    readyForPickupApi.getOrders()
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : []
        const packedList = list.filter((o) => (o.status || '').toLowerCase() === 'packed')
        knownOrderIdsRef.current = new Set(packedList.map((o) => o.id))
        hasInitializedRef.current = true
        setOrders(packedList)
      })
      .catch((err) => {
        console.error('Failed to load packed orders:', err.message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    const interval = setInterval(() => {
      fetchPackedOrders()
    }, 4000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [fetchPackedOrders])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
        setIsFullscreen(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-white flex flex-col justify-between selection:bg-orange-500 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background lighting glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5">
            <img
              src={logoImg}
              alt="Chick Blast Logo"
              className="h-12 w-auto object-contain bg-white/10 p-1.5 rounded-2xl border border-white/10 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
                  CHICK BLAST
                </h1>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-emerald-400 m-0 mt-0.5 flex items-center gap-1.5">
                <Sparkles size={14} /> Ready For Pickup
              </p>
            </div>
          </div>

          {/* Right: Clock & TV Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Clock Display */}
            <div className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-amber-300 shadow-inner">
              <Clock size={16} className="text-amber-400" />
              <span>{currentTime}</span>
            </div>

            {/* Ready Count Badge */}
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
              <PackageCheck size={18} />
              <span>{orders.length} READY</span>
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? 'Chime Sound Enabled (Click to Mute)' : 'Chime Sound Muted (Click to Unmute)'}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-md shadow-orange-500/20'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen for TV Display"
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchPackedOrders(true)}
              title="Manual Refresh"
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400">Loading live pickup board...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto text-center py-16 px-6 card-glass rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <PackageCheck size={40} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white m-0 tracking-tight">
                All Orders Collected!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium m-0 leading-relaxed">
                Currently, no orders are waiting for pickup. Fresh orders will appear here the moment they are packed by the kitchen.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> Live auto-update active
              </span>
            </div>
          </div>
        ) : (
          /* Glass Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => {
              const itemCount = (order.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)
              const timeSincePacked = moment(order.updatedAt || order.createdAt).fromNow()

              return (
                <div
                  key={order.id}
                  className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 hover:border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/60 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
                >
                  {/* Glass Top Shimmer Highlight */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all" />

                  {/* Card Header: Order Tag & Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono font-black uppercase tracking-widest text-amber-300/80">
                        ORDER NUMBER
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        READY
                      </span>
                    </div>

                    {/* Giant Gradient Order Number */}
                    <div className="py-2">
                      <h2 className="text-6xl sm:text-7xl font-black tracking-tight bg-gradient-to-br from-amber-300 via-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-md m-0 font-mono">
                        #{order.orderNo}
                      </h2>
                    </div>

                    {/* Customer & Items Meta */}
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      {order.customerName && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{order.customerName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag size={14} className="text-orange-400" />
                          {itemCount} {itemCount === 1 ? 'Item' : 'Items'} Packed
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {timeSincePacked}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA pill */}
                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Collect at Counter
                    </span>
                    <span className="text-[11px] font-black text-amber-400 group-hover:text-emerald-400 transition-colors">
                      Counter 1 →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Screen Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-white/[0.02] backdrop-blur-xl px-4 py-3 text-center">
        <p className="text-xs font-semibold text-slate-400 m-0 tracking-wide">
          🍗 Chick Blast Live Counter Display • Please present your <span className="text-amber-400 font-bold font-mono">Order #</span> at the collection counter when ready.
        </p>
      </footer>
    </div>
  )
}
