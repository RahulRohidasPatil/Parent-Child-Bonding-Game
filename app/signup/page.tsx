"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Role, Screen } from "@/lib/types";
import { ageFromDate, emailPattern, getSignupMode } from "@/lib/utils";
import { SignupField as Field } from "@/components/signup/signup-field";
import { SignupHeader } from "@/components/signup/signup-header";

export default function SignupPage() {
  const [screen, setScreen] = useState<Screen>("form");
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | "">("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [tried, setTried] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const age = ageFromDate(dob);
  const isMinor = age !== null && age < 18 && role === "student";
  const mode = getSignupMode(age, role);
  const canContinue = formStep === 1
    ? Boolean(name.trim() && role && dob && ((mode === "adult" && email.trim()) || (mode === "minor" && parentEmail.trim())))
    : Boolean(username.trim() && password && confirmation);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your name.";
    if (!role) next.role = "Choose Student or Parent.";
    if (!dob) next.dob = "Enter your date of birth.";
    else if (age === null) next.dob = "That date of birth does not look right.";
    else if (role === "parent" && age < 16) next.dob = "Parent accounts are for ages 16 and up.";
    if (mode === "adult") {
      if (!email) next.email = "Enter your email.";
      else if (!emailPattern.test(email)) next.email = "That email does not look right.";
    }
    if (mode === "minor") {
      if (!parentEmail) next.parentEmail = "Enter a parent or guardian email.";
      else if (!emailPattern.test(parentEmail)) next.parentEmail = "That email does not look right.";
      if (email && !emailPattern.test(email)) next.email = "That email does not look right.";
      if (email && email.trim().toLowerCase() === parentEmail.trim().toLowerCase()) next.email = "Use a different email from your parent or guardian.";
    }
    if (formStep === 2) {
      if (!username) next.username = "Choose a username.";
      else if (!/^[A-Za-z0-9_.]{4,20}$/.test(username)) next.username = "Use 4–20 letters, numbers, dots or underscores.";
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) next.password = "Use 8+ characters with a letter and a number.";
      if (!confirmation) next.confirmation = "Type your password again.";
      else if (confirmation !== password) next.confirmation = "Passwords do not match.";
    }
    return next;
  }, [age, role, name, dob, email, parentEmail, username, password, confirmation, mode, formStep]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    setError("");
    if (Object.keys(errors).length) return;
    if (formStep === 1) {
      setFormStep(2);
      setTried(false);
      return;
    }
    if (isMinor) {
      const response = await fetch("/api/registration/learner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerDisplayName: name, parentEmail, learnerBirthYear: Number(dob.slice(0, 4)) }),
      });
      if (!response.ok) {
        setError("We could not send the approval request. Please try again.");
        return;
      }
    } else if (role === "parent") {
      const { error: signUpError } = await createClient().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            account_type: "parent",
            display_name: name.trim(),
            username: username.trim(),
          },
        },
      });
      if (signUpError) {
        setError("We could not create that account. Check your details and try again.");
        return;
      }
    } else {
      setError("Learner accounts must be approved by a parent or guardian first.");
      return;
    }
    setScreen("sent");
  }

  const fieldClass = (field: string) => `h-12 rounded-xl bg-[#f8fafb] px-3.5 text-base font-bold ${tried && errors[field] ? "border-[#b42318]" : "border-[#d5dde2]"}`;
  const step = screen === "form" ? formStep : screen === "sent" ? 3 : 4;

  if (screen !== "form") {
    const minor = isMinor;
    return <main className="flex min-h-dvh items-center justify-center bg-[#faf9f5] px-4 py-6 text-[#1f2d3a]">
      <section className="flex min-h-[min(844px,calc(100dvh-3rem))] w-full max-w-[390px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_rgba(31,45,58,.12)]">
        <SignupHeader step={step} title={screen === "active" ? "Account activated" : minor ? "Ask a parent to approve" : "Verify your email"} subtitle={screen === "active" ? minor ? "Your parent approved your account. You’re all set." : "Your email is verified. You’re all set." : minor ? "Your account switches on as soon as your parent taps the link." : "Tap the link we sent to activate your account."} />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-3">
          <div className="flex h-44 items-center justify-center rounded-[22px] bg-[#e6f4ee]">{screen === "active" ? <span className="grid size-24 place-items-center rounded-full bg-[#2e8a69]"><Check className="size-14 text-white" strokeWidth={3} /></span> : <Mail className="size-20 text-[#2e8a69]" strokeWidth={1.5} />}</div>
          <div className="rounded-[18px] border-[1.5px] border-[#d5dde2] p-3.5"><p className="text-[13px] font-extrabold text-[#51606d]">{screen === "active" ? "Username" : minor ? "Approval link sent to your parent" : "Verification link sent to"}</p><p className="mt-1 break-all text-[17px] font-black">{screen === "active" ? username : minor ? parentEmail : email}</p></div>
          {screen === "sent" && <div className="flex flex-col gap-3"><p className="font-black">What happens next</p>{(minor ? ["Your parent opens the email from QuestNest.", "They tap Approve account.", "You log in with your username and password."] : ["Open the email from QuestNest.", "Tap Verify account.", "Log in with your username and password."]).map((text, index) => <div className="flex gap-3" key={text}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#23303a] text-xs font-black text-white">{index + 1}</span><span className="pt-0.5 text-[15px] font-bold leading-6 text-[#33424f]">{text}</span></div>)}</div>}
          {screen === "active" && <p className="text-[15px] font-bold leading-6 text-[#51606d]">Log in with the username and password you just set.</p>}
          {resent && <p className="text-sm font-extrabold text-[#1f7a57]" role="status">Sent again. It can take a minute to arrive.</p>}
        </div>
        <footer className="flex gap-2 border-t border-[#eef2f4] bg-white p-5"><Button type="button" onClick={() => setScreen(screen === "active" ? "sent" : "form")} variant="glass" className="h-13 flex-1 rounded-2xl border-[#d5dde2]">{screen === "active" ? "Back" : "Change details"}</Button>{screen === "sent" ? <Button type="button" onClick={() => setResent(true)} className="h-13 flex-1 rounded-2xl bg-[#2e8a69] text-white hover:bg-[#277a5d]">Resend email</Button> : <Link href="/" className="flex h-13 flex-1 items-center justify-center rounded-2xl bg-[#2e8a69] font-black text-white shadow-[0_4px_0_#226e52]">Go to log in</Link>}</footer>
      </section>
    </main>;
  }

  return <main className="flex min-h-dvh items-center justify-center bg-[#faf9f5] px-4 py-6 text-[#1f2d3a]"><section className="flex min-h-[min(844px,calc(100dvh-3rem))] w-full max-w-[390px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_rgba(31,45,58,.12)]"><SignupHeader step={step} title={formStep === 1 ? "Create your account" : "Secure your account"} subtitle={formStep === 1 ? "Tell us a little about yourself to get started." : "Set your login details. You’ll use these to come back to QuestNest."} /><form id="signup-form" onSubmit={submit} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-3">
    {formStep === 1 && <><Field label="Your name" error={tried ? errors.name : undefined}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Morgan" autoComplete="name" className={fieldClass("name")} /></Field>
    <Field label="I’m signing up as" error={tried ? errors.role : undefined}><div className="grid grid-cols-2 gap-2">{(["student", "parent"] as Role[]).map((item) => <button type="button" key={item} onClick={() => setRole(item)} className={`h-12 rounded-xl border-[1.5px] text-sm font-black ${role === item ? "border-[#23303a] bg-[#23303a] text-white" : "border-[#d5dde2] bg-white"}`}>{item === "student" ? "Student" : "Parent"}</button>)}</div></Field>
    <Field label="Date of birth" error={tried ? errors.dob : undefined}><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={fieldClass("dob")} /></Field>
    {isMinor && <div className="flex gap-2.5 rounded-xl bg-[#fff4e0] p-3 text-sm font-bold leading-5 text-[#6b4100]"><Info className="mt-0.5 size-5 shrink-0" />You’re under 16, so a parent has to approve your account. We’ll email them a link.</div>}
    {mode === "adult" && <Field label="Enter your email" hint="We’ll send your verification link here." error={tried ? errors.email : undefined}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={fieldClass("email")} /></Field>}
    {isMinor && <><Field label="Enter parent’s email" error={tried ? errors.parentEmail : undefined}><Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@example.com" className={fieldClass("parentEmail")} /></Field><Field label={<>Your own email <span className="font-bold">(optional)</span></>} error={tried ? errors.email : undefined}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={fieldClass("email")} /></Field></>}
    </>}
    {formStep === 2 && <><div className="my-1 h-px bg-[#e3e8ec]" /><Field label="Set username" error={tried ? errors.username : undefined}><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. nova_reads" autoComplete="username" className={fieldClass("username")} /></Field>
    <Field label="Set password" error={tried ? errors.password : undefined}><div className="relative"><Input type={showPasswords ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" className={`${fieldClass("password")} pr-11`} /><button type="button" aria-label={showPasswords ? "Hide passwords" : "Show passwords"} onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#51606d]">{showPasswords ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></Field>
    <Field label="Confirm password" error={tried ? errors.confirmation : undefined}><Input type={showPasswords ? "text" : "password"} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Type it again" autoComplete="new-password" className={fieldClass("confirmation")} /></Field></>}
    {error && <p className="text-center text-sm font-extrabold text-[#b42318]" role="alert">{error}</p>}
  </form><footer className="flex flex-col gap-3 border-t border-[#eef2f4] bg-white p-5"><div className="flex gap-2"><Button type="button" variant="glass" className="h-14 flex-1 rounded-2xl border-[#d5dde2]" disabled={formStep === 1} onClick={() => { setFormStep(1); setTried(false); }}>Back</Button><Button form="signup-form" type="submit" disabled={!canContinue} className="h-14 flex-[2] rounded-2xl bg-[#2e8a69] text-[17px] font-black text-white shadow-[0_4px_0_#226e52] hover:bg-[#277a5d]">{formStep === 1 ? "Continue" : "Create account"}</Button></div><p className="text-center text-sm font-bold text-[#51606d]">Have an account? <Link href="/register/parent" className="font-black text-[#1f7a57] underline">Log in</Link></p></footer></section></main>;
}

