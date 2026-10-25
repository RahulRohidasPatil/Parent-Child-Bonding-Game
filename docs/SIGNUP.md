# Signup flow

The signup experience lives at `/signup` and is split into two client-side form steps:

1. Personal details, role, date of birth, and email information.
2. Username, password, and password confirmation.

The presentation is separated into reusable components:

- `components/signup/signup-header.tsx` — step indicator and page header.
- `components/signup/signup-field.tsx` — labelled field wrapper, hints, and errors.
- `app/(auth)/register/register-form.tsx` — form state, Clerk submission, and flow-specific rendering.

Shared signup types and helpers are kept in the root shared modules:

- `lib/types.ts` — reusable application types.
- `lib/utils.ts` — shared utilities, including date-of-birth and signup-mode helpers.

## Clerk behavior

Parent registration calls Clerk's `signUp.create()` with the parent email, password, username, and
the existing display name, account type, date of birth, and parent email as user metadata. Clerk
email verification remains required.

Learners under 16 use the parent's email as the Clerk verification address, so the parent receives
the verification link. The learner's username and the existing profile fields are stored as Clerk
user metadata.

Required public environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

## Testing locally

Run the app with `npm run dev`, then open `/register`.

Test these cases:

- Parent with valid details: the button advances to credentials, then Clerk sends confirmation.
- Under-18 student: the parent email is required and the request goes to the pending flow.
- Invalid or incomplete fields: Continue/Create account remains disabled or displays validation errors.
- Matching learner and parent emails: the request is rejected by client validation.

Do not add service-role keys, SMTP credentials, approval tokens, or learner passwords to client code.
