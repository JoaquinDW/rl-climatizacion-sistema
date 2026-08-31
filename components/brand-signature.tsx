import Image from "next/image"
import { LOGO_PATH, MARCA } from "@/lib/marca"

export function BrandSignature({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 ${className}`}
      aria-label={MARCA}
    >
      <span className="h-10 w-10 overflow-hidden rounded-md border border-white/15 bg-[#08090b]">
        <Image
          src={LOGO_PATH}
          alt=""
          width={150}
          height={150}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="font-display text-lg font-bold uppercase tracking-[0.08em] text-brand-display">
        {MARCA}
      </span>
    </div>
  )
}
