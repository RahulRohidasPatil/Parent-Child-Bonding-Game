import type { Metadata } from "next";
import { NewLesson } from "./new-lesson";

export const metadata: Metadata = { title: "New lesson" };

export default function NewLessonPage() {
  return <NewLesson />;
}
