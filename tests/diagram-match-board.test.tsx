// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DiagramMatchBoard, type DiagramMatchBoardProps } from "../components/qn/diagram-match-board";

afterEach(cleanup);
const fixture = (patch: Partial<DiagramMatchBoardProps> = {}): DiagramMatchBoardProps => ({
  board: { title: "Plant energy", mermaid: 'flowchart LR; a["a: ?"] --> b["b: ?"]', slots: ["a", "b"], options: ["Sunlight", "Sugar", "Water"] },
  placements: {}, html: '<html><body>Masked diagram</body></html>', busy: false, finished: false,
  remainingSeconds: 60, wrongFinishes: 0, feedback: null, onPlace: vi.fn(), onFinish: vi.fn(), ...patch,
});
const disabled = (button: HTMLElement) => (button as HTMLButtonElement).disabled;

describe("tap-to-place diagram match", () => {
  it("selects a word and saves a placement without pretending the server has accepted it", () => {
    const props = fixture();
    render(<DiagramMatchBoard {...props} />);
    expect(disabled(screen.getByRole("button", { name: "Slot a: empty" }))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Select label 1: Sunlight" }));
    fireEvent.click(screen.getByRole("button", { name: "Slot a: empty" }));
    expect(props.onPlace).toHaveBeenCalledExactlyOnceWith({ a: 0 });
    expect(screen.getByRole("button", { name: "Slot a: empty" })).toBeTruthy();
    expect(disabled(screen.getByRole("button", { name: "Check my diagram" }))).toBe(true);
  });

  it("moves an already placed word without duplicate labels and can clear a slot", () => {
    const props = fixture({ placements: { a: 0, b: 1 } });
    const view = render(<DiagramMatchBoard {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Select label 1: Sunlight, placed in a" }));
    fireEvent.click(screen.getByRole("button", { name: "Slot b: Sugar" }));
    expect(props.onPlace).toHaveBeenCalledExactlyOnceWith({ b: 0 });
    view.rerender(<DiagramMatchBoard {...props} placements={{ b: 0 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear slot b" }));
    expect(props.onPlace).toHaveBeenLastCalledWith({});
  });

  it("submits only a complete unique mapping and leaves correctness to the server", () => {
    const props = fixture({ placements: { a: 0, b: 0 } });
    const view = render(<DiagramMatchBoard {...props} />);
    expect(disabled(screen.getByRole("button", { name: "Check my diagram" }))).toBe(true);
    view.rerender(<DiagramMatchBoard {...props} placements={{ a: 0, b: 1 }} feedback="One label is correct. Try the other again." wrongFinishes={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Check my diagram" }));
    expect(props.onFinish).toHaveBeenCalledOnce();
    expect(screen.getByText("One label is correct. Try the other again.")).toBeTruthy();
  });

  it.each([
    [{ busy: true }, "Saving…"],
    [{ finished: true }, "Diagram completed"],
    [{ remainingSeconds: 0 }, "Time is up"],
  ] as const)("locks all edits and submission for %o", (state, action) => {
    const props = fixture({ placements: { a: 0, b: 1 }, ...state });
    render(<DiagramMatchBoard {...props} />);
    const bank = screen.getByRole("button", { name: "Select label 1: Sunlight, placed in a" });
    const clear = screen.getByRole("button", { name: "Clear slot a" });
    const finish = screen.getByRole("button", { name: action });
    expect(disabled(bank)).toBe(true);
    expect(disabled(clear)).toBe(true);
    expect(disabled(finish)).toBe(true);
    fireEvent.click(clear); fireEvent.click(finish);
    expect(props.onPlace).not.toHaveBeenCalled();
    expect(props.onFinish).not.toHaveBeenCalled();
  });

  it("keeps the server-rendered diagram in the existing opaque sandbox", () => {
    render(<DiagramMatchBoard {...fixture()} />);
    const frame = screen.getByTitle("Plant energy");
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("srcdoc")).toContain("Masked diagram");
  });
});
