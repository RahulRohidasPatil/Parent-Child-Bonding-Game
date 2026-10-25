// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HeadsUpRound, type HeadsUpRoundProps } from "../components/qn/heads-up-round";

const turn: HeadsUpRoundProps["turn"] = {
  index: 0, guesser: "Alice", explainer: "Bob", you_are: "guesser", ends_at_ms: 100000,
  card: { index: 7, term: "Photosynthesis", forbidden: ["plant", "sunlight", "sugar"] },
};
afterEach(cleanup);

it("keeps the guesser's term out of the DOM until the forehead-ready action", () => {
  render(<HeadsUpRound turn={turn} remainingSeconds={30} busy={false} onAction={vi.fn()} />);
  expect(screen.queryByText("Photosynthesis")).toBeNull();
  expect(screen.queryByRole("button", { name: "Got it" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Ready — hold phone to forehead" }));
  expect(screen.getByText("Photosynthesis")).toBeTruthy();
  expect(screen.getByText("sunlight")).toBeTruthy();
});

it("shows the explainer the card and sends only the server card index and action", () => {
  const action = vi.fn();
  render(<HeadsUpRound turn={{ ...turn, you_are: "explainer" }} remainingSeconds={20} busy={false} onAction={action} />);
  expect(screen.getByText("Photosynthesis")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Got it" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip" }));
  fireEvent.click(screen.getByRole("button", { name: "Forbidden word" }));
  expect(action.mock.calls).toEqual([["correct", 7], ["skip", 7], ["violation", 7]]);
});

it("does not show a spectator a term even if a stale payload still contains a card", () => {
  render(<HeadsUpRound turn={{ ...turn, you_are: "watching" }} remainingSeconds={20} busy={false} onAction={vi.fn()} />);
  expect(screen.getByText("Watch this pair")).toBeTruthy();
  expect(screen.queryByText("Photosynthesis")).toBeNull();
  expect(screen.queryByText("sunlight")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});

it("resets the reveal when the next turn arrives", () => {
  const props = { turn, remainingSeconds: 30, busy: false, onAction: vi.fn() };
  const view = render(<HeadsUpRound {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Ready — hold phone to forehead" }));
  view.rerender(<HeadsUpRound {...props} turn={{ ...turn, index: 1, card: { ...turn.card!, term: "Gravity" } }} />);
  expect(screen.queryByText("Gravity")).toBeNull();
  expect(screen.getByRole("button", { name: "Ready — hold phone to forehead" })).toBeTruthy();
});

it("blocks card actions while saving and when the server deadline has elapsed", () => {
  const action = vi.fn();
  const props = { turn: { ...turn, you_are: "explainer" }, remainingSeconds: 20, busy: true, onAction: action };
  const view = render(<HeadsUpRound {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Got it" }));
  expect(action).not.toHaveBeenCalled();
  view.rerender(<HeadsUpRound {...props} remainingSeconds={0} busy={false} />);
  expect(screen.queryByText("Photosynthesis")).toBeNull();
  expect(screen.getByText("Time’s up!")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});

it("handles exhausted cards without leaving controls for a stale card", () => {
  render(<HeadsUpRound turn={{ ...turn, you_are: "explainer", card: undefined }} remainingSeconds={15} busy={false} onAction={vi.fn()} />);
  expect(screen.getByText("All cards played")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});
