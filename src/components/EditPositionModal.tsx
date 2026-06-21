import { useEffect, useMemo, useState } from 'react';
import { defaultPieces } from 'react-chessboard';
import { Eraser, Pencil, Shuffle } from 'lucide-react';
import {
  buildFenFromEditorState,
  createChess960EditorState,
  createEmptyEditorState,
  createStandardEditorState,
  normalizeEnPassant,
  parseFenToEditorState,
  type EditorPositionState,
  type EditorTool,
} from '../utils/positionEditor';
import { EditPositionBoard } from './EditPositionBoard';
import type { BoardOrientation } from '../utils/editModeInteraction';
const PIECE_GROUPS = [
  {
    label: 'White',
    pieces: ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'] as const,
  },
  {
    label: 'Black',
    pieces: ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as const,
  },
] as const;

interface EditPositionModalProps {
  initialFen: string;
  isOpen: boolean;
  boardOrientation: BoardOrientation;
  onApply: (fen: string) => void;
  onCancel: () => void;
  onValidate: (state: EditorPositionState) => string | null;
}

export function EditPositionModal({
  initialFen,
  isOpen,
  boardOrientation,
  onApply,
  onCancel,
  onValidate,
}: EditPositionModalProps) {
  const [editorState, setEditorState] = useState(() => parseFenToEditorState(initialFen));
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'error' | 'success' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEditorState(parseFenToEditorState(initialFen));
    setSelectedTool(null);
    setStatusMessage(null);
    setStatusTone(null);
  }, [initialFen, isOpen]);

  const previewFen = useMemo(() => buildFenFromEditorState(editorState), [editorState]);
  const activeCastling = (['K', 'Q', 'k', 'q'] as const)
    .filter((flag) => editorState.castlingRights[flag])
    .join('') || '-';

  if (!isOpen) return null;

  const updatePosition = (position: EditorPositionState['position']) => {
    setEditorState((current) => ({ ...current, position }));
    setStatusMessage(null);
    setStatusTone(null);
  };

  const selectTool = (tool: EditorTool) => {
    setSelectedTool((current) => (current === tool ? null : tool));
    setStatusMessage(null);
    setStatusTone(null);
  };

  const handleApply = () => {
    const validationError = onValidate(editorState);
    if (validationError) {
      setStatusMessage(validationError);
      setStatusTone('error');
      return;
    }

    onApply(previewFen);
  };

  const handleValidatePosition = () => {
    const validationError = onValidate(editorState);

    if (validationError) {
      setStatusMessage(validationError);
      setStatusTone('error');
      return;
    }

    setStatusMessage('Position looks valid. Apply when you are ready.');
    setStatusTone('success');
  };

  const handleLoadPreset = (nextState: EditorPositionState) => {
    setEditorState(nextState);
    setSelectedTool(null);
    setStatusMessage(null);
    setStatusTone(null);
  };

  return (
    <div className="fixed inset-0 z-40 bg-brand-bg/85 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-brand-border bg-brand-bg/50">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">
                <Pencil className="w-3.5 h-3.5" />
                Edit Position Mode
              </div>
              <h3 className="mt-3 text-xl font-bold text-white">Build a custom board position</h3>
              <p className="mt-1 text-sm text-brand-secondary">
                Pick a tool to place pieces, or drag an existing board piece to move it.
              </p>
            </div>

            <button
              onClick={onCancel}
              className="rounded-lg border border-brand-border bg-brand-bg px-4 py-2 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-0">
            <div className="p-5 border-b xl:border-b-0 xl:border-r border-brand-border">
              <EditPositionBoard
                position={editorState.position}
                selectedTool={selectedTool}
                boardOrientation={boardOrientation}
                onPositionChange={updatePosition}
              />

              <div className="mt-4 rounded-xl border border-brand-border bg-brand-bg/60 p-3">
                <div className="text-xs uppercase tracking-[0.22em] text-brand-secondary/80">Preview FEN</div>
                <div className="mt-2 break-all font-mono text-xs text-white">{previewFen}</div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Piece Palette</h4>
                  <span className="text-xs text-brand-secondary">
                    Tap a tool, then tap squares to place it. Drag board pieces directly.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PIECE_GROUPS.map((group) => (
                    <div key={group.label} className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-secondary/80">
                        {group.label}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {group.pieces.map((pieceCode) => {
                          const PieceSvg = defaultPieces[pieceCode];
                          const isSelected = selectedTool === pieceCode;

                          return (
                            <button
                              key={pieceCode}
                              onClick={() => selectTool(pieceCode)}
                              className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2.5 transition-all ${
                                isSelected
                                  ? 'border-purple-400 bg-purple-400/15 text-white shadow-[0_0_0_1px_rgba(192,132,252,0.45),0_0_24px_rgba(192,132,252,0.22)] scale-105'
                                  : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                              }`}
                              title={pieceCode}
                            >
                              <span className="w-8 h-8">
                                <PieceSvg />
                              </span>
                              <span className="text-[10px] font-medium tracking-wide">{pieceCode}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => selectTool('erase')}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 transition-all ${
                    selectedTool === 'erase'
                      ? 'border-purple-400 bg-purple-400/15 text-white shadow-[0_0_0_1px_rgba(192,132,252,0.45),0_0_24px_rgba(192,132,252,0.22)] scale-[1.02]'
                      : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  Eraser
                </button>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-white">Position Controls</h4>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-brand-secondary/80">
                      Side to move
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['w', 'b'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setEditorState((current) => ({ ...current, activeColor: color }));
                            setStatusMessage(null);
                            setStatusTone(null);
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                            editorState.activeColor === color
                              ? 'border-brand-accent bg-brand-accent/15 text-white'
                              : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {color === 'w' ? 'White to move' : 'Black to move'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-brand-secondary/80">
                      Castling rights
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['K', 'Q', 'k', 'q'] as const).map((flag) => (
                        <button
                          key={flag}
                          onClick={() => {
                            setEditorState((current) => ({
                              ...current,
                              castlingRights: {
                                ...current.castlingRights,
                                [flag]: !current.castlingRights[flag],
                              },
                            }));
                            setStatusMessage(null);
                            setStatusTone(null);
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                            editorState.castlingRights[flag]
                              ? 'border-brand-accent bg-brand-accent/15 text-white'
                              : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {flag}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-brand-secondary">Current: {activeCastling}</div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="editor-en-passant"
                      className="text-xs font-medium uppercase tracking-[0.18em] text-brand-secondary/80"
                    >
                      En passant target
                    </label>
                    <input
                      id="editor-en-passant"
                      value={editorState.enPassant}
                      onChange={(event) => {
                        setEditorState((current) => ({
                          ...current,
                          enPassant: normalizeEnPassant(event.target.value),
                        }));
                        setStatusMessage(null);
                        setStatusTone(null);
                      }}
                      placeholder="-"
                      className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-white placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                    />
                    <div className="text-xs text-brand-secondary">Use `-`, `e3`, or `d6`.</div>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-white">Quick Actions</h4>

                  <button
                    onClick={() => handleLoadPreset(createEmptyEditorState())}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Clear Board
                  </button>

                  <button
                    onClick={() => handleLoadPreset(createStandardEditorState())}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Standard Setup
                  </button>

                  <button
                    onClick={() => handleLoadPreset(createChess960EditorState())}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Shuffle className="w-4 h-4" />
                    Chess960 Random
                  </button>

                  <div className="rounded-lg border border-brand-border/70 bg-brand-bg/60 px-3 py-3 text-xs text-brand-secondary leading-5">
                    Normal gameplay is paused while the editor is open. Apply to replace the live game with this draft position.
                  </div>
                </div>
              </section>

              {statusMessage && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    statusTone === 'success'
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border border-red-500/30 bg-red-500/10 text-red-200'
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-1">
                <button
                  onClick={onCancel}
                  className="rounded-lg border border-brand-border bg-brand-bg px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleValidatePosition}
                  className="rounded-lg border border-brand-border bg-brand-bg px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                >
                  Validate Position
                </button>

                <button
                  onClick={handleApply}
                  className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent/90 transition-colors"
                >
                  Apply Position
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
