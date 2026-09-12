import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[38px] sm:h-[40px] w-full min-w-0 rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-2 text-[13.5px] text-[#111] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#999] focus-visible:border-[#1f2328] focus-visible:ring-1 focus-visible:ring-[#1f2328]/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
