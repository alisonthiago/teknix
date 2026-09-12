import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#1f2328] text-white hover:bg-black font-semibold cursor-pointer shadow-none",
        outline:
          "border-[#e6e6e6] bg-white text-[#333333] hover:bg-[#f8fafc] hover:text-[#111111] hover:border-[#d1d5db] cursor-pointer aria-expanded:bg-[#f5f5f5] aria-expanded:text-[#111111]",
        secondary:
          "bg-white text-[#333333] border border-[#e6e6e6] hover:bg-[#f8fafc] hover:border-[#d1d5db] font-medium cursor-pointer aria-expanded:bg-[#f5f5f5] aria-expanded:text-[#1f2328]",
        ghost:
          "hover:bg-[#f5f5f5] hover:text-foreground cursor-pointer aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-[#1f2328] underline-offset-4 hover:underline cursor-pointer",
      },
      size: {
        default:
          "h-[38px] gap-2 px-4 text-[13.5px] rounded-lg",
        xs: "h-6 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-[12.5px] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 text-sm rounded-lg font-semibold",
        icon: "size-[38px] rounded-lg",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
