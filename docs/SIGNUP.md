# Signup flow

The signup experience lives at `/signup` and is split into two client-side form steps:

1. Personal details, role, date of birth, and email information.
2. Username, password, and password confirmation.

The presentation is separated into reusable components:

- `components/signup/signup-header.tsx` — step indicator and page header.
- `components/signup/signup-field.tsx` — labelled field wrapper, hints, and errors.
- `app/signup/page.tsx` — form state, Supabase submission, and flow-specific rendering.

Shared signup types and helpers are kept in the root shared modules:

- `lib/types.ts` — reusable application types.
- `lib/utils.ts` — shared utilities, including date-of-birth and signup-mode helpers.

## Supabase behavior

Parent registration calls `supabase.auth.signUp()` from the browser client with the parent email,
password, display name, username, and `account_type: "parent"` metadata. Supabase email confirmation
must remain enabled.

Learners under 18 do not create an Auth user. Their submission calls `/api/registration/learner`,
which creates a pending request and sends the parent notification through the server-only email path.
The learner account must be provisioned only after the server-side approval and authority checks.

Required public environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Testing locally

Run the app with `npm run dev`, then open `/signup`.

Test these cases:

- Parent with valid details: the button advances to credentials, then Supabase sends confirmation.
- Under-18 student: the parent email is required and the request goes to the pending flow.
- Invalid or incomplete fields: Continue/Create account remains disabled or displays validation errors.
- Matching learner and parent emails: the request is rejected by client validation.

Do not add service-role keys, SMTP credentials, approval tokens, or learner passwords to client code.
