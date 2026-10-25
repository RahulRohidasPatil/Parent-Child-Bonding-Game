# Signup and verification

The active form is `app/(auth)/register/register-form.tsx`; validation is in `lib/registration.ts`. `/signup` leads to registration. Clerk manages credentials and email verification.

The form collects personal details/role/date of birth/email, then username/password/confirmation. Student is stored as `learner`. Profile fields are user-provided Clerk unsafe metadata, not verified age or authority.

| Case | Account/verification email |
| --- | --- |
| Learner under 16 | Parent email; own email optional and different if supplied |
| Learner 16+ | Own email |
| Parent | Own email; form requires age 16+ |

The cutoff is 16. An older under-18 pending-flow description did not match the active form. Validation rejects ages below 5 although the message says ages 10 and up; reconcile that before claiming one enforced minimum.

The form calls Clerk `signUp.create`. Complete signup activates the session and initializes learning. Otherwise it starts an email-link flow, opens `/verify` and returns through `/verify/callback`.

Using a parent email does not create a parent account or link accounts. Clerk uniqueness can prevent using that address again. Verification and a selected parent label do not establish guardianship or legal consent.

Family settings expose a separate optional backend approval-request workflow. It records decisions, not Clerk activation or mandatory app-wide consent. Its flags, secret and explicit mail worker belong to the backend.

Check both sides of age 16, invalid dates/emails, duplicate accounts, password mismatch, callback and provider failures when changing this flow. Never log passwords or verification proofs.
