import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function SignupHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return <header className="border-b border-line px-5 pb-4 pt-5"><div className="mb-4 flex items-center gap-2"><Link href="/" aria-label="Back" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><ArrowLeft className="size-5" /></Link><span className="text-xs font-black uppercase tracking-[.14em] text-muted-foreground">Step {step} of 3</span><div className="ml-auto flex gap-1.5">{[1, 2, 3].map((item) => <span key={item} className={`h-1.5 w-9 rounded-full ${item <= step ? "bg-brand" : "bg-line"}`} />)}</div></div><h1 className="text-2xl font-black tracking-tight">{title}</h1><p className="mt-1 text-sm font-bold leading-5 text-muted-foreground">{subtitle}</p></header>;
}
