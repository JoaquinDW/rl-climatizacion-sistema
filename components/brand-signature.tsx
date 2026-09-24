import Image from "next/image"
import { LOGO_PATH, MARCA } from "@/lib/marca"

export function BrandSignature({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 ${className}`}
      aria-label={MARCA}
    >
      <span className="h-12 w-16 overflow-hidden rounded-md border border-[#d7c180]/20 bg-[#050505]">
        <Image
          src={LOGO_PATH}
          alt=""
          width={362}
          height={272}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="font-display text-lg font-bold uppercase tracking-[0.08em] text-brand-display">
        {MARCA}
      </span>
    </div>
  )
}
