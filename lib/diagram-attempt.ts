import type { Board, PlayerAction } from "./diagram-api";
import { DiagramApiError } from "./diagram-api";
import { moveCard } from "./diagram-placement";

type AttemptIO = {
  save: (
    id: string,
    version: number,
    placements: Record<string, string>,
  ) => Promise<PlayerAction>;
  board: (id: string) => Promise<Board>;
};
export type AttemptState = {
  board: Board;
  placements: Record<string, string>;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  lastAction: PlayerAction | null;
  incorrectSlotIds: string[];
};

export class DiagramAttempt {
  state: AttemptState;
  private pending: {
    version: number;
    placements: Record<string, string>;
    retried: boolean;
  } | null = null;
  private active: Promise<void> | null = null;
  private disposed = false;
  private lastWrite = 0;
  constructor(
    board: Board,
    private io: AttemptIO,
    private changed: (state: AttemptState) => void,
  ) {
    this.state = {
      board,
      placements: { ...board.placements },
      dirty: false,
      saving: false,
      error: null,
      lastAction: null,
      incorrectSlotIds: [],
    };
  }
  private publish(next: Partial<AttemptState>) {
    this.state = { ...this.state, ...next };
    if (!this.disposed) this.changed(this.state);
  }
  place(slotId: string, cardId: string | null) {
    if (
      this.disposed ||
      !this.state.board.slots.some((slot) => slot.id === slotId)
    )
      return;
    if (
      cardId !== null &&
      !this.state.board.cards.some((card) => card.id === cardId)
    )
      return;
    if ((this.state.placements[slotId] ?? null) === cardId) return;
    const placements = moveCard(this.state.placements, slotId, cardId);
    this.publish({
      placements,
      dirty: true,
      error: null,
      incorrectSlotIds: this.state.incorrectSlotIds.filter(
        (id) => placements[id] === this.state.placements[id],
      ),
    });
  }
  applyAction(action: PlayerAction) {
    this.publish({
      board: { ...this.state.board, version: action.version },
      lastAction: action,
      incorrectSlotIds: action.incorrect_slot_ids ?? [],
    });
  }
  acknowledge() {
    if (!this.state.dirty) this.publish({ error: null });
  }
  reload(board: Board) {
    this.pending = null;
    this.publish({
      board,
      placements: { ...board.placements },
      dirty: false,
      error: null,
      lastAction: null,
      incorrectSlotIds: [],
    });
  }
  flush(): Promise<void> {
    if (this.active) return this.active;
    this.active = this.drain().finally(() => {
      this.active = null;
    });
    return this.active;
  }
  private async drain() {
    if (!this.state.dirty || this.disposed) return;
    this.publish({ saving: true, error: null });
    try {
      while (this.state.dirty && !this.disposed) {
        const wait = Math.max(0, 1000 - (Date.now() - this.lastWrite));
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
        if (this.disposed) break;
        const pending = this.pending ?? {
          version: this.state.board.version,
          placements: { ...this.state.placements },
          retried: false,
        };
        this.pending = pending;
        try {
          this.lastWrite = Date.now();
          const result = await this.io.save(
            this.state.board.id,
            pending.version,
            pending.placements,
          );
          if (pending.retried) {
            const current = await this.io.board(this.state.board.id);
            if (current.version > result.version) {
              this.reload(current);
              this.publish({
                error:
                  "Your board changed on another device. The latest saved placements have been loaded.",
              });
              return;
            }
          }
          const dirty =
            JSON.stringify(this.state.placements) !==
            JSON.stringify(pending.placements);
          this.pending = null;
          this.publish({
            board: {
              ...this.state.board,
              version: result.version,
              placements: pending.placements,
            },
            dirty,
            lastAction: result,
          });
        } catch (error) {
          pending.retried = true;
          if (error instanceof DiagramApiError && error.status === 409) {
            try {
              const current = await this.io.board(this.state.board.id);
              this.reload(current);
              this.publish({
                error:
                  "Your board changed. The latest saved placements have been loaded; check them before continuing.",
              });
            } catch (refreshError) {
              this.publish({
                error:
                  refreshError instanceof Error
                    ? refreshError.message
                    : "Could not reload your board. Refresh before retrying.",
              });
            }
          } else {
            this.publish({
              error:
                error instanceof Error
                  ? error.message
                  : "Could not save. Retry your placements.",
            });
          }
          throw error;
        }
      }
    } finally {
      this.publish({ saving: false });
    }
  }
  dispose() {
    this.disposed = true;
  }
}
