import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 [--btn-depth:color-mix(in_oklch,var(--primary),black_35%)]",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // Splash game buttons — pair with size="game" for the chunky 3D press.
        sun: "bg-sun text-ink hover:brightness-105 [--btn-depth:color-mix(in_oklch,var(--sun),black_40%)]",
        coral:
          "bg-coral text-ink hover:brightness-105 [--btn-depth:color-mix(in_oklch,var(--coral),black_40%)]",
        mint: "bg-mint text-ink hover:brightness-105 [--btn-depth:color-mix(in_oklch,var(--mint),black_40%)]",
        glass:
          "border-border bg-card text-foreground hover:bg-accent [--btn-depth:color-mix(in_oklch,var(--foreground)_18%,transparent)]",
        // QuestNest
        brand:
          "bg-brand text-white shadow-[0_4px_0_0_var(--brand-depth)] hover:brightness-105 active:not-aria-[haspopup]:translate-y-[2px] active:shadow-[0_2px_0_0_var(--brand-depth)] disabled:shadow-none",
        soft: "border-[1.5px] border-input bg-card text-foreground hover:bg-muted",
        night: "bg-night text-white hover:brightness-110",
        brandSoft: "bg-brand-soft text-brand-dark hover:brightness-[0.98]",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        cta: "h-14 gap-2 rounded-2xl px-6 text-[17px] font-black [&_svg:not([class*='size-'])]:size-5",
        pill: "h-11 gap-1.5 rounded-xl px-4 text-[15px] font-extrabold [&_svg:not([class*='size-'])]:size-[18px]",
        chip: "h-9 gap-1.5 rounded-full px-3.5 text-sm font-extrabold",
        round: "size-11 rounded-full [&_svg:not([class*='size-'])]:size-5",
        game: "h-14 gap-2 rounded-2xl px-6 font-heading text-lg font-semibold tracking-wide shadow-[0_5px_0_0_var(--btn-depth,oklch(0_0_0/35%))] active:not-aria-[haspopup]:translate-y-[3px] active:shadow-[0_2px_0_0_var(--btn-depth,oklch(0_0_0/35%))] disabled:opacity-40 [&_svg:not([class*='size-'])]:size-5",
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
