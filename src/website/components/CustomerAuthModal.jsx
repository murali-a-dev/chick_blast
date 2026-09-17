import { useState, useEffect, useRef } from 'react'
import {
  X,
  User,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useCustomer } from '../../shared/context/CustomerContext'
import { useCart } from '../../shared/context/CartContext'
import { customersApi } from '../../shared/api'
import logoImg from '../../assets/logo.png'

export default function CustomerAuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalConfig,
    loginCustomer,
  } = useCustomer()

  const { setCustomerName, setCustomerMobile } = useCart()

  // Steps: 'mobile' -> 'name' (for new user) -> 'otp' -> 'success'
  const [step, setStep] = useState('mobile')
  const [mobileNo, setMobileNo] = useState('')
  const [name, setName] = useState('')
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)

  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const mobileInputRef = useRef(null)
  const nameInputRef = useRef(null)
  const modalRef = useRef(null)

  // Strictly lock background body and html scrolling when modal is open
  useEffect(() => {
    if (!isAuthModalOpen) return

    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.documentElement.style.overflow = 'hidden'

    const preventBackdropScroll = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel', preventBackdropScroll, { passive: false })
    window.addEventListener('touchmove', preventBackdropScroll, { passive: false })

    return () => {
      document.body.style.overflow = originalBodyOverflow || ''
      document.body.style.touchAction = originalTouchAction || ''
      document.documentElement.style.overflow = originalHtmlOverflow || ''
      window.removeEventListener('wheel', preventBackdropScroll)
      window.removeEventListener('touchmove', preventBackdropScroll)
    }
  }, [isAuthModalOpen])

  const [prevIsOpen, setPrevIsOpen] = useState(isAuthModalOpen)
  if (isAuthModalOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setStep('mobile')
    setMobileNo(authModalConfig?.prefillMobile || '')
    setName(authModalConfig?.prefillName || '')
    setIsExistingUser(false)
    setOtpDigits(['', '', '', ''])
    setError('')
    setLoading(false)
    setResendTimer(30)
  } else if (!isAuthModalOpen && prevIsOpen) {
    setPrevIsOpen(false)
  }

  // Auto-focus mobile input when modal is opened
  useEffect(() => {
    if (isAuthModalOpen) {
      const timer = setTimeout(() => {
        mobileInputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isAuthModalOpen])

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null
    if (isAuthModalOpen && step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isAuthModalOpen, step, resendTimer])

  if (!isAuthModalOpen) return null

  const isMobileValid = mobileNo.trim().length === 10
  const isNameValid = name.trim().length >= 2

  // Handle Mobile Submit / Right Arrow click
  const handleProceedFromMobile = async (e) => {
    if (e) e.preventDefault()
    if (!isMobileValid || loading) return

    setLoading(true)
    setError('')

    try {
      const checkRes = await customersApi.check(mobileNo)
      if (checkRes.exists && checkRes.customer) {
        setIsExistingUser(true)
        setName(checkRes.customer.Name || '')
        setStep('otp')
        setTimeout(() => otpInputRefs[0].current?.focus(), 150)
      } else {
        setIsExistingUser(false)
        setStep('name')
        setTimeout(() => nameInputRef.current?.focus(), 150)
      }
    } catch {
      // Fallback for offline/mock mode
      setIsExistingUser(false)
      setStep('name')
      setTimeout(() => nameInputRef.current?.focus(), 150)
    } finally {
      setLoading(false)
    }
  }

  // Handle Name Submit -> proceed to OTP
  const handleProceedFromName = (e) => {
    if (e) e.preventDefault()
    if (!isNameValid || loading) return
    setError('')
    setStep('otp')
    setTimeout(() => otpInputRefs[0].current?.focus(), 150)
  }

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = cleanValue
    setOtpDigits(newDigits)
    setError('')

    // Auto-advance to next input
    if (cleanValue && index < 3) {
      otpInputRefs[index + 1].current?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus()
    }
  }

  // Clipboard paste support to auto-fill all 4 OTP boxes
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pastedData) return

    const newDigits = ['', '', '', '']
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i]
    }
    setOtpDigits(newDigits)
    setError('')

    const nextIndex = Math.min(pastedData.length, 3)
    otpInputRefs[nextIndex].current?.focus()
  }

  // Quick fill demo OTP 1234
  const handleQuickFillOtp = () => {
    setOtpDigits(['1', '2', '3', '4'])
    setError('')
    setTimeout(() => {
      otpInputRefs[3].current?.focus()
    }, 50)
  }

  // Verify OTP & finalize login / registration
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    const enteredOtp = otpDigits.join('')
    if (enteredOtp.length !== 4) {
      setError('Please enter all 4 digits of the OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await customersApi.verifyOtp({
        mobileNo,
        otp: enteredOtp,
        name: name.trim(),
        isNewUser: !isExistingUser,
      })

      if (res.success && res.customer) {
        setStep('success')
        loginCustomer(res.customer, res.orders || [])

        // Sync with Cart page state
        setCustomerName(res.customer.Name || name.trim())
        setCustomerMobile(res.customer.MobileNo || mobileNo)

        setTimeout(() => {
          closeAuthModal()
          if (typeof authModalConfig.onSuccess === 'function') {
            authModalConfig.onSuccess(res.customer)
          }
        }, 1200)
      } else {
        throw new Error(res.error || 'Verification failed')
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal-gradient-bg !p-3 sm:!p-4 animate-fade-in"
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div
        ref={modalRef}
        className="modal-content !max-w-md !rounded-3xl border border-white/60 shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Gradient Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-5 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white border-none cursor-pointer transition-transform active:scale-90"
            title="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
              <img src={logoImg} alt="Chick Blast" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md text-amber-100">
                <Sparkles size={11} /> Chick Blast Account
              </span>
              <h2 className="text-xl font-black text-white m-0 tracking-tight leading-tight">
                {step === 'success'
                  ? 'Welcome to Chick Blast!'
                  : step === 'otp'
                  ? 'Verify OTP'
                  : step === 'name'
                  ? 'New Customer Profile'
                  : 'Customer Login / Signup'}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body with Step transitions */}
        <div className="p-5 sm:p-6 space-y-5 bg-white">
          {/* STEP 1: MOBILE NUMBER ENTRY */}
          {step === 'mobile' && (
            <form onSubmit={handleProceedFromMobile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Mobile Number
                </label>
                <p className="text-xs text-gray-500 m-0">
                  Enter your 10-digit number. Existing users log in instantly, new users register in seconds.
                </p>
              </div>

              {/* Mobile Input with Integrated Right Arrow Button */}
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 text-gray-600 font-bold text-sm pointer-events-none">
                  <span className="text-base">🇮🇳</span>
                  <span>+91</span>
                  <span className="text-gray-300">|</span>
                </div>

                <input
                  ref={mobileInputRef}
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={mobileNo}
                  onChange={(e) => {
                    setError('')
                    setMobileNo(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }}
                  className="input-field !pl-20 !pr-14 text-base font-bold tracking-wide"
                  maxLength={10}
                />

                {/* Right Arrow Proceed Button */}
                <button
                  type="submit"
                  disabled={!isMobileValid || loading}
                  className={`absolute right-2 w-10 h-10 rounded-xl flex items-center justify-center border-none transition-all duration-200 cursor-pointer ${
                    isMobileValid && !loading
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:bg-orange-600 active:scale-95'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Proceed to next step"
                >
                  <ArrowRight size={20} className={loading ? 'animate-pulse' : ''} />
                </button>
              </div>

              {/* Validation & Helper Badge */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-400 font-medium">
                  {mobileNo.length}/10 digits
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-emerald-200">
                  <ShieldCheck size={13} /> SMS Verification
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!isMobileValid || loading}
                className="w-full btn-primary !py-3 !rounded-2xl text-sm font-black shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Checking account...' : 'Continue'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 1B: NEW USER NAME ENTRY */}
          {step === 'name' && (
            <form onSubmit={handleProceedFromName} className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('mobile')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 border-none bg-transparent cursor-pointer p-0"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  New Customer
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  What is your full name?
                </label>
                <p className="text-xs text-gray-500 m-0">
                  This will be stored in your Customer profile for food orders & bill tokens.
                </p>
              </div>

              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. Murali"
                  value={name}
                  onChange={(e) => {
                    setError('')
                    setName(e.target.value)
                  }}
                  className="input-field !pl-10 text-sm font-semibold"
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Registering Phone:</span>
                <span className="font-black text-gray-900">+91 {mobileNo}</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!isNameValid || loading}
                className="w-full btn-primary !py-3 !rounded-2xl text-sm font-black shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Verify OTP</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFY PAGE */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(isExistingUser ? 'mobile' : 'name')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 border-none bg-transparent cursor-pointer p-0"
                >
                  <ArrowLeft size={14} /> Change Details
                </button>
                <span className="text-xs font-bold text-gray-500">
                  Code sent to <b className="text-gray-900">+91 {mobileNo}</b>
                </span>
              </div>

              {/* 4-Box Styled OTP Inputs */}
              <div className="space-y-1 text-center pt-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Enter 4-Digit Verification Code
                </label>
                <div className="flex items-center justify-center gap-3 pt-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="tel"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-13 h-14 text-center text-2xl font-black rounded-2xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 outline-none transition-all shadow-xs bg-slate-50/50 focus:bg-white"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Verify Action Button */}
              <button
                type="submit"
                disabled={otpDigits.join('').length !== 4 || loading}
                className="w-full btn-primary !py-3.5 !rounded-2xl text-sm font-black shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>{loading ? 'Verifying OTP...' : 'Verify & Continue'}</span>
              </button>

              {/* Resend OTP Link */}
              <div className="text-center text-xs text-gray-500 pt-1">
                {resendTimer > 0 ? (
                  <span>Resend code in <b className="text-gray-700">{resendTimer}s</b></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setResendTimer(30)
                      handleQuickFillOtp()
                    }}
                    className="text-orange-600 font-extrabold hover:underline bg-transparent border-none cursor-pointer inline-flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/80 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={42} className="animate-tick-pop" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 m-0">Verified Successfully!</h3>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold m-0">
                  Welcome back, <b className="text-gray-900">{name || 'Customer'}</b> (+91 {mobileNo})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
