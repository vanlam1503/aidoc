// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlashcardPractice } from "@/components/flashcards/flashcard-practice";
import type { Flashcard } from "@/lib/flashcards/deck";

const bank: Flashcard[] = Array.from({ length: 4 }, (_, i) => ({ id: `q${i}`, question: `Question ${i}?`, answer: `Answer ${i}`, lessonId: "lesson", lessonTitle: "Lesson", section: "section", essential: i === 0, references: [] }));

describe("flashcard practice", () => {
  it("locks an answer, scores once, and supports missed-only review and restart", () => {
    render(<FlashcardPractice cards={[bank[0]]} bank={bank} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Start practice" }));
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: /Answer 1/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Incorrect");
    fireEvent.click(screen.getByRole("button", { name: /Answer 0/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Incorrect");
    fireEvent.click(screen.getByRole("button", { name: /See results/ }));
    expect(screen.getByText("0 / 1")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Review missed questions/ }));
    fireEvent.click(screen.getByRole("button", { name: /Answer 0/ }));
    fireEvent.click(screen.getByRole("button", { name: /See results/ }));
    expect(screen.getByText("1 / 1")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Review missed/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Shuffle and restart" }));
    expect(screen.getByRole("heading", { name: "Question 0?" })).toBeVisible();
  });
  it("shows a disabled start for an empty deck", () => {
    render(<FlashcardPractice cards={[]} bank={bank} locale="vi" />);
    expect(screen.getByRole("button", { name: "Bắt đầu ôn tập" })).toBeDisabled();
  });
});
