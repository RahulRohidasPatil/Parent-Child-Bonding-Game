export function SignupField({ label, hint, error, children }: { label: React.ReactNode; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-[13px] font-extrabold text-muted-foreground">{label}</span>{children}{error ? <span className="text-[13px] font-extrabold text-[#b42318]">{error}</span> : hint ? <span className="text-[13px] font-bold text-muted-foreground">{hint}</span> : null}</label>;
}
