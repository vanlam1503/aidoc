import "server-only";
import { getLessons } from "../content/loader";
import { extractFlashcards } from "./deck";

export function getFlashcardBanks() {
  return {
    en: getLessons("en").flatMap(extractFlashcards),
    vi: getLessons("vi").flatMap(extractFlashcards),
  };
}
