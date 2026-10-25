import { http } from "./learn-api";
import { getAccountKey, setState } from "./store";
import type { DuelSheet } from "./social-api";

/** Display the server's paid reward; an idle player earns no participation coins. */
export function duelReward(sheet: DuelSheet): number {
  return sheet.results.some((answer) => answer.choice !== null) ? sheet.score * 10 + 20 : 0;
}

let latestWalletRequest = 0;

/** Refresh a balance, never mint coins in the browser. Ignore an old account's in-flight reply. */
export async function refreshWallet(): Promise<number> {
  const request = ++latestWalletRequest;
  const accountAtRequest = getAccountKey();
  const wallet = await http.get<{ coins: number }>("me/wallet?limit=1");
  if (request === latestWalletRequest && accountAtRequest === getAccountKey()) {
    setState((s) => ({ serverCoins: wallet.coins, ...(s.homeMeta ? { homeMeta: { ...s.homeMeta, coins: wallet.coins } } : {}) }));
  }
  return wallet.coins;
}
