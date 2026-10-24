import type { Metadata } from "next";
import { FriendsScreen } from "./friends-screen";

export const metadata: Metadata = { title: "Friends and family" };

export default function FriendsPage() {
  return <FriendsScreen />;
}
