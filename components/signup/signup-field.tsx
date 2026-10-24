export function SignupField({ label, hint, error, children }: { label: React.ReactNode; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-[13px] font-extrabold text-[#51606d]">{label}</span>{children}{error ? <span className="text-[13px] font-extrabold text-[#b42318]">{error}</span> : hint ? <span className="text-[13px] font-bold text-[#51606d]">{hint}</span> : null}</label>;
}
