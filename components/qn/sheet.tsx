"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom sheet on phones, centred panel on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  sub,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-[rgba(31,45,58,.35)] duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[88dvh] w-full max-w-[520px] flex-col gap-3.5 overflow-y-auto rounded-t-[28px] bg-card px-[18px] pt-2.5 pb-[max(24px,env(safe-area-inset-bottom))] outline-none duration-200 data-open:animate-in data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0",
            "md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:rounded-[28px] md:pt-5 md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95",
            className,
          )}
        >
          <span className="h-[5px] w-11 shrink-0 self-center rounded-full bg-input md:hidden" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <DialogPrimitive.Title className="text-[21px] font-black">{title}</DialogPrimitive.Title>
              {sub && <DialogPrimitive.Description className="text-[13px] font-bold text-muted-foreground">{sub}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted hover:bg-muted">
              <X className="size-[18px]" strokeWidth={2.6} />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
