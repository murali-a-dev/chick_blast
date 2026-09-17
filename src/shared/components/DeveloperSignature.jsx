import { ArrowUpRight, Heart, Code2 } from 'lucide-react'
import version from '../../../package.json'
import logoImg from '../../assets/logo.png'

const DEVELOPER_INFO = {
  name: 'Murali',
  portfolioUrl: 'https://my-self-murali.vercel.app/',
  version: version.version,
  year: new Date().getFullYear(),
}

export default function DeveloperSignature({ variant = 'footer', className = '' }) {
  // 1. Compact Variant (for modest inline placements / modals / cards)
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mt-3 px-1 ${className}`}
      >
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-gray-400">Dev:</span>
          <a
            href={DEVELOPER_INFO.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-gray-800 hover:text-orange-600 transition-colors inline-flex items-center gap-0.5 no-underline group"
          >
            <span>{DEVELOPER_INFO.name}</span>
            <ArrowUpRight size={12} className="text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
        <span className="font-mono text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-semibold">
          v{DEVELOPER_INFO.version}
        </span>
      </div>
    )
  }

  // 2. Sidebar Variant (Clean Minimal Dark Widget for Admin Sidebar)
  if (variant === 'sidebar') {
    return (
      <div className={`p-3 mx-2 my-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Developed By</span>
          <span className="text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
            v{DEVELOPER_INFO.version}
          </span>
        </div>
        <a
          href={DEVELOPER_INFO.portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-white font-semibold hover:text-orange-400 transition-colors no-underline group"
        >
          <span className="flex items-center gap-1.5">
            <Code2 size={13} className="text-orange-500" />
            <span>{DEVELOPER_INFO.name}</span>
          </span>
          <ArrowUpRight size={13} className="text-slate-400 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>
      </div>
    )
  }

  // 3. Default Website Footer Variant (Sleek Minimalist Bar)
  return (
    <footer className={`mt-8 mb-20 md:mb-6 px-4 max-w-6xl mx-auto ${className}`}>
      <div className="rounded-2xl bg-white/80 border border-orange-100/90 py-3.5 px-4 sm:px-6 shadow-2xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          {/* Left: Brand Identity & Version */}
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="Chick Blast Logo"
              className="w-7 h-7 object-contain drop-shadow-2xs"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 tracking-tight">Chick Blast</span>
              <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200/80">
                v{DEVELOPER_INFO.version}
              </span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                © {DEVELOPER_INFO.year} All rights reserved.
              </span>
            </div>
          </div>

          {/* Right: Clean Minimal Developer Signature */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
            <span>Crafted with</span>
            <Heart size={13} className="text-red-500 fill-red-500 animate-pulse inline" />
            <span>by</span>
            <a
              href={DEVELOPER_INFO.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 font-bold text-xs no-underline border border-orange-200/60 transition-all duration-200 group"
            >
              <span>{DEVELOPER_INFO.name}</span>
              <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}


