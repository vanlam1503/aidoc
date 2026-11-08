import { describe, expect, it } from "vitest";
import { getFlashcardBanks } from "@/lib/flashcards/loader";
import { createPracticeDeck } from "@/lib/flashcards/deck";

describe("interview flashcard bank", () => {
  const banks = getFlashcardBanks();
  it("extracts 99 sourced questions per language with matching stable IDs", () => {
    expect(banks.en).toHaveLength(99);
    expect(banks.vi).toHaveLength(99);
    expect(banks.vi.map((card) => card.id)).toEqual(banks.en.map((card) => card.id));
    for (const bank of Object.values(banks)) {
      expect(new Set(bank.map((card) => card.id)).size).toBe(99);
      expect(bank.filter((card) => card.essential)).toHaveLength(33);
      for (const card of bank) {
        expect(card.question).not.toContain("Essential");
        expect(card.answer.length).toBeGreaterThan(20);
        expect(card.references.length).toBeGreaterThan(0);
        if (card.essential) expect(card.reason).toBeTruthy();
      }
    }
  });
  it("gives every question four unique answers with exactly one source match", () => {
    for (const bank of Object.values(banks)) {
      for (const { card, options } of createPracticeDeck(bank, bank)) {
        expect(options).toHaveLength(4);
        expect(new Set(options.map((option) => option.text)).size).toBe(4);
        expect(options.filter((option) => option.id === card.id)).toEqual([{ id: card.id, text: card.answer }]);
      }
    }
  });
  it("can practice one lesson or one missed card using the full answer bank", () => {
    const bank = banks.en;
    const cards = bank.filter((card) => card.lessonId === bank[0].lessonId);
    expect(createPracticeDeck(cards, bank)).toHaveLength(3);
    expect(createPracticeDeck([cards[0]], bank)[0].options).toHaveLength(4);
    expect(() => createPracticeDeck(cards, cards)).toThrow(/four distinct/);
  });
  it("reshuffles answer positions without mutating the bank", () => {
    const bank = banks.en;
    const before = JSON.stringify(bank);
    const first = createPracticeDeck([bank[0]], bank, () => 0);
    const second = createPracticeDeck([bank[0]], bank, () => 0.999);
    expect(first[0].options.findIndex((option) => option.id === bank[0].id)).not.toBe(second[0].options.findIndex((option) => option.id === bank[0].id));
    expect(JSON.stringify(bank)).toBe(before);
  });
});
