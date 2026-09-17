import { useRef, useState, useEffect } from 'react'
import { ChevronRight, Check, ChevronsRight, Lock } from 'lucide-react'

export default function SwipeToConfirm({ onConfirm, disabled, label = 'Swipe to Place Order', resetTrigger }) {
  const trackRef = useRef(null)
  const startX = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [shake, setShake] = useState(false)
  const [maxOffset, setMaxOffset] = useState(200)
  const [prevReset, setPrevReset] = useState(resetTrigger)

  // Adjust state during render when resetTrigger changes
  if (resetTrigger !== prevReset) {
    setPrevReset(resetTrigger)
    setConfirmed(false)
    setOffset(0)
  }

  // Measure track width safely in effect to avoid accessing ref during render
  useEffect(() => {
    const updateMax = () => {
      if (trackRef.current) {
        setMaxOffset(Math.max(50, trackRef.current.offsetWidth - 56))
      }
    }
    updateMax()
    window.addEventListener('resize', updateMax)
    return () => window.removeEventListener('resize', updateMax)
  }, [])

  // Touch and mouse start
  const handleStart = (clientX) => {
    if (disabled || confirmed) {
      if (disabled) {
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
      return
    }
    setDragging(true)
    startX.current = clientX - offset
  }

  const handleMouseDown = (e) => {
    handleStart(e.clientX)
  }

  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX)
  }

  // Touch and mouse move listener attached to window
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging || disabled || confirmed) return
      const newOffset = Math.max(0, Math.min(e.clientX - startX.current, maxOffset))
      setOffset(newOffset)
    }

    const handleTouchMove = (e) => {
      if (!dragging || disabled || confirmed) return
      const newOffset = Math.max(0, Math.min(e.touches[0].clientX - startX.current, maxOffset))
      setOffset(newOffset)
    }

    const handleEnd = async () => {
      if (!dragging || disabled || confirmed) return
      setDragging(false)
      if (offset >= maxOffset * 0.65) {
        setOffset(maxOffset)
        setConfirmed(true)
        try {
          if (onConfirm) {
            await onConfirm()
          }
        } catch {
          // If onConfirm rejects, reset slider
          setConfirmed(false)
          setOffset(0)
        }
      } else {
        setOffset(0)
      }
    }

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [dragging, disabled, confirmed, offset, maxOffset, onConfirm])

  const progressRatio = Math.min(1, Math.max(0, offset / (maxOffset || 1)))
  const labelOpacity = Math.max(0, 1 - progressRatio * 1.5)

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`relative w-full h-14 rounded-2xl overflow-hidden select-none touch-none flex items-center shadow-lg transition-all duration-200 ${
        shake ? 'animate-pulse scale-[0.99] ring-2 ring-orange-400' : ''
      } ${
        confirmed
          ? 'bg-emerald-600 shadow-emerald-600/30'
          : disabled
          ? 'bg-gray-100 border border-gray-200 cursor-not-allowed'
          : 'bg-slate-950 border border-slate-800 shadow-orange-500/20 cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Glowing Filled Trail */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-75"
        style={{
          width: confirmed ? '100%' : `${offset + 30}px`,
          opacity: confirmed ? 1 : 0.95,
        }}
      />

      {/* Label Text Layer (Properly offset so handle never overlaps start text) */}
      <div
        className="absolute inset-0 pl-14 pr-4 flex items-center justify-center gap-2 pointer-events-none transition-opacity duration-150"
        style={{ opacity: confirmed ? 1 : labelOpacity }}
      >
        <span
          className={`text-xs sm:text-sm font-black tracking-wider uppercase truncate ${
            confirmed
              ? 'text-white'
              : disabled
              ? 'text-gray-400 font-bold'
              : 'text-white drop-shadow-sm'
          }`}
        >
          {confirmed ? 'Order Placed Successfully!' : label}
        </span>
        {!confirmed && !disabled && (
          <ChevronsRight size={18} className="text-amber-300 animate-pulse shrink-0" />
        )}
      </div>

      {/* Handle Button */}
      <div
        className={`absolute left-1 top-1 bottom-1 w-12 rounded-xl flex items-center justify-center shadow-md z-10 transition-colors ${
          confirmed
            ? 'bg-white text-emerald-600'
            : disabled
            ? 'bg-white text-gray-400 shadow-xs'
            : 'bg-white text-orange-500 hover:scale-105 active:scale-95'
        }`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {confirmed ? (
          <Check size={24} className="text-emerald-600 stroke-[3]" />
        ) : disabled ? (
          <Lock size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={22} className="text-orange-500 stroke-[3]" />
        )}
      </div>
    </div>
  )
}
