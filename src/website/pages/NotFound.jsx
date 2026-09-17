import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import logoImg from '../../assets/logo.png'

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="relative mb-6">
        <img
          src={logoImg}
          alt="Chick Blast"
          className="h-24 w-auto object-contain animate-bounce drop-shadow-lg"
        />
        {/* <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
          404 Error
        </span> */}
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
        Oops! This Chicken Flew Away 🍗
      </h1>
      <p className="text-gray-600 max-w-md mb-8 text-base leading-relaxed">
        The page you are looking for doesn't exist or has been moved to another bucket. Let's get you back to the delicious food!
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <Home size={18} />
          <span>Back to Menu</span>
        </Link>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl border border-gray-200 shadow-sm transition-all"
        >
          <ArrowLeft size={18} />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  )
}
