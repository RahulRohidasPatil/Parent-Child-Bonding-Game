import "server-only";

/**
 * Talks to Supabase Auth directly when NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set, translating the auth API's
 * routes (/auth/login, /auth/register, …) and status codes so the
 * /api/auth/* handlers work unchanged with either backend.
 */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(URL_ && KEY);

type Json = Record<string, unknown>;

const reply = (body: unknown, status: number) =>
  status === 204
    ? new Response(null, { status })
    : Response.json(body, { status });

async function call(path: string, init: { method?: string; body?: Json; token?: string | null } = {}) {
  return fetch(`${URL_}/auth/v1${path}`, {
    method: init.method ?? "POST",
    headers: {
      apikey: KEY!,
      "Content-Type": "application/json",
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
}

/** Supabase error bodies are `{error_code, msg}` or `{error, error_description}`. */
async function failure(res: Response) {
  let code = "";
  let message = "";
  try {
    const b = (await res.json()) as Json;
    code = String(b.error_code ?? b.error ?? "");
    message = String(b.msg ?? b.message ?? b.error_description ?? "");
  } catch {
    /* not JSON */
  }
  return { code, message };
}

const bearer = (init: RequestInit) => {
  const h = new Headers(init.headers);
  return h.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? null;
};

/** Same contract as the FastAPI auth API: same paths, bodies and status codes. */
export async function supabaseAuthApi(path: string, init: RequestInit = {}): Promise<Response> {
  const input = (init.body ? JSON.parse(String(init.body)) : {}) as Json;

  switch (path) {
    case "/auth/login": {
      const res = await call("/token?grant_type=password", { body: { email: input.email, password: input.password } });
      if (res.ok) return reply(await res.json(), 200);
      const { code, message } = await failure(res);
      if (code === "email_not_confirmed") return reply({ detail: message }, 403);
      if (code === "invalid_credentials" || code === "invalid_grant") return reply({ detail: message }, 401);
      return reply({ detail: message || "Couldn’t sign in." }, res.status === 429 ? 429 : res.status);
    }

    case "/auth/register": {
      const res = await call("/signup", {
        body: {
          email: input.email,
          password: input.password,
          data: {
            display_name: input.display_name,
            account_type: input.account_type,
            ...(typeof input.birth_date === "string" ? { birth_date: input.birth_date } : {}),
          },
        },
      });
      if (res.ok) return reply({ detail: "Check your email to confirm the account." }, 202);
      const { code, message } = await failure(res);
      if (code === "user_already_exists" || code === "email_exists")
        return reply({ detail: "An account with this email already exists. Try logging in." }, 422);
      if (code === "weak_password") return reply({ detail: message || "That password is too weak." }, 422);
      return reply({ detail: message || "Couldn’t create the account." }, res.status === 429 ? 429 : res.status);
    }

    case "/auth/verify": {
      const res = await call("/verify", { body: { email: input.email, token: input.token, type: "email" } });
      if (res.ok) return reply(await res.json(), 200);
      const { code, message } = await failure(res);
      if (code === "otp_expired" || res.status === 403) return reply({ detail: message }, 401);
      return reply({ detail: message || "Couldn’t verify the code." }, res.status);
    }

    case "/auth/resend": {
      const res = await call("/resend", { body: { type: "signup", email: input.email } });
      if (res.ok) return reply({}, 202);
      const { message } = await failure(res);
      return reply({ detail: message || "Couldn’t resend." }, res.status);
    }

    case "/auth/me": {
      const res = await call("/user", { method: "GET", token: bearer(init) });
      if (res.ok) return reply(await res.json(), 200);
      // Expired or invalid access token: the caller then tries a refresh.
      if (res.status === 401 || res.status === 403) return reply({ detail: "Not signed in." }, 401);
      return reply({ detail: "Auth service error." }, res.status);
    }

    case "/auth/refresh": {
      const res = await call("/token?grant_type=refresh_token", { body: { refresh_token: input.refresh_token } });
      if (res.ok) return reply(await res.json(), 200);
      if (res.status < 500) return reply({ detail: "Session expired." }, 401);
      return reply({ detail: "Auth service error." }, res.status);
    }

    case "/auth/logout": {
      const res = await call("/logout", { token: bearer(init) });
      return reply(null, res.ok ? 204 : res.status);
    }

    default:
      // e.g. /auth/demo-accounts only exists on the FastAPI demo server.
      return reply({ detail: "Not found." }, 404);
  }
}
