import { readJson, requireUserId, respond, setAvatar } from "@/lib/server/social";

/** The look friends see for you: `{ avatar }`. The shop keeps it in the browser, so the app syncs it here. */
export async function POST(req: Request) {
  return respond(async () => {
    const me = await requireUserId();
    const { avatar } = await readJson(req);
    return setAvatar(me, typeof avatar === "string" ? avatar : "");
  });
}
