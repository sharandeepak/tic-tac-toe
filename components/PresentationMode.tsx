"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GameState, CellValue } from "@/lib/game";
import { getGameState, resetGame, deleteAllGames, undoLastMove } from "@/lib/gameService";
import { Trophy, Minus, Swords, Gamepad2, RotateCcw, Trash2, Loader2, Link2, Copy, Check, Undo2 } from "lucide-react";
import confetti from "canvas-confetti";

interface PresentationModeProps {
	gameId: string;
}

const POLL_INTERVAL = 1000;

export function PresentationMode({ gameId }: PresentationModeProps) {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
	const [animatingCells, setAnimatingCells] = useState<Set<number>>(new Set());
	const [prevBoard, setPrevBoard] = useState<CellValue[]>(Array(9).fill(null));
	const [resetting, setResetting] = useState(false);
	const [deletingAll, setDeletingAll] = useState(false);
	const [undoing, setUndoing] = useState(false);
	const [copiedLink, setCopiedLink] = useState<'x' | 'o' | 'presentation' | null>(null);
	const confettiTriggered = useRef(false);
	const prevWinner = useRef<string>("");

	// Confetti effect when someone wins
	const fireConfetti = useCallback(() => {
		const count = 200;
		const defaults = {
			origin: { y: 0.7 },
			zIndex: 9999,
		};

		function fire(particleRatio: number, opts: confetti.Options) {
			confetti({
				...defaults,
				...opts,
				particleCount: Math.floor(count * particleRatio),
			});
		}

		fire(0.25, { spread: 26, startVelocity: 55 });
		fire(0.2, { spread: 60 });
		fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
		fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
		fire(0.1, { spread: 120, startVelocity: 45 });
	}, []);

	useEffect(() => {
		const pollGame = async () => {
			try {
				const state = await getGameState(gameId);
				if (state) {
					// Track new marks for animation
					const newAnims = new Set<number>();
					state.board.forEach((val: CellValue, i: number) => {
						if (val && !prevBoard[i]) {
							newAnims.add(i);
						}
					});
					if (newAnims.size > 0) {
						setAnimatingCells(newAnims);
						setTimeout(() => setAnimatingCells(new Set()), 800);
					}
					setPrevBoard(state.board);
					setGameState(state);
					setLastUpdated(new Date());

					// Trigger confetti on win
					if (state.gameStatus === "finished" && state.winner && state.winner !== prevWinner.current) {
						prevWinner.current = state.winner;
						fireConfetti();
						setTimeout(() => fireConfetti(), 300);
						setTimeout(() => fireConfetti(), 600);
					}
				} else {
					// Game was deleted
					setGameState(null);
					prevWinner.current = "";
				}
			} catch (error) {
				console.error("Error polling game:", error);
			} finally {
				setIsLoading(false);
			}
		};

		pollGame();
		const intervalId = setInterval(pollGame, POLL_INTERVAL);
		return () => clearInterval(intervalId);
	}, [gameId, prevBoard, fireConfetti]);

	const handleReset = async () => {
		setResetting(true);
		try {
			await resetGame(gameId);
			prevWinner.current = "";
		} catch (error) {
			console.error("Error resetting game:", error);
		} finally {
			setResetting(false);
		}
	};

	const handleDeleteAll = async () => {
		if (!confirm("Are you sure you want to delete all games? This cannot be undone.")) return;
		setDeletingAll(true);
		try {
			await deleteAllGames();
			setGameState(null);
			prevWinner.current = "";
		} catch (error) {
			console.error("Error deleting all games:", error);
		} finally {
			setDeletingAll(false);
		}
	};

	const handleUndo = async () => {
		setUndoing(true);
		try {
			const success = await undoLastMove(gameId);
			if (success) {
				// The next poll will pick up the updated state
				prevWinner.current = "";
			}
		} catch (error) {
			console.error("Error undoing move:", error);
		} finally {
			setUndoing(false);
		}
	};

	// Generate links
	const getPlayerXLink = () => {
		if (typeof window === "undefined" || !gameState) return "";
		const params = new URLSearchParams({
			player: gameState.playerX,
			opponent: gameState.playerO,
		});
		return `${window.location.origin}/play?${params.toString()}`;
	};

	const getPlayerOLink = () => {
		if (typeof window === "undefined" || !gameState) return "";
		const params = new URLSearchParams({
			player: gameState.playerO,
			opponent: gameState.playerX,
		});
		return `${window.location.origin}/play?${params.toString()}`;
	};

	const getPresentationLink = () => {
		if (typeof window === "undefined") return "";
		return `${window.location.origin}/present`;
	};

	const copyLink = async (type: 'x' | 'o' | 'presentation') => {
		let link = "";
		if (type === 'x') link = getPlayerXLink();
		else if (type === 'o') link = getPlayerOLink();
		else link = getPresentationLink();
		
		try {
			await navigator.clipboard.writeText(link);
			setCopiedLink(type);
			setTimeout(() => setCopiedLink(null), 2000);
		} catch {
			const textarea = document.createElement("textarea");
			textarea.value = link;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopiedLink(type);
			setTimeout(() => setCopiedLink(null), 2000);
		}
	};

	const renderCell = (index: number) => {
		const value = gameState?.board[index];
		const isAnimating = animatingCells.has(index);

		return (
			<div
				key={index}
				className={`
          w-full aspect-square rounded-2xl font-black flex items-center justify-center
          transition-all duration-300
        `}
				style={{
					fontSize: "clamp(3rem, 8vw, 6rem)",
					background: value ? (value === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)") : "var(--g-cell)",
					border: value ? `3px solid ${value === "X" ? "var(--g-x)" : "var(--g-o)"}` : "3px solid var(--g-cell-border)",
					boxShadow: value ? `0 0 25px ${value === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}` : "none",
				}}
			>
				{value && (
					<span className={isAnimating ? "anim-cell-pop" : ""} style={{ color: value === "X" ? "var(--g-x)" : "var(--g-o)" }}>
						{value}
					</span>
				)}
			</div>
		);
	};

	if (!gameState) {
		return (
			<div className="game-bg flex items-center justify-center p-6">
				<div className="text-center anim-slide-up max-w-md w-full">
					<div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 anim-glow-pulse" style={{ background: "var(--g-accent-bg)", color: "var(--g-accent)" }}>
						<Gamepad2 size={48} />
					</div>
					<p className="text-2xl font-bold mb-6" style={{ color: "var(--g-text-2)" }}>
						{isLoading ? "Waiting for game..." : "No active game"}
					</p>
					
					{/* Presentation Link */}
					<div className="game-surface rounded-xl p-4 mb-4">
						<div className="flex items-center gap-2 mb-3">
							<Link2 size={16} style={{ color: "var(--g-accent)" }} />
							<span className="text-sm font-bold" style={{ color: "var(--g-text)" }}>Presentation Link</span>
						</div>
						<div className="flex items-center gap-1 p-2 rounded-lg overflow-hidden" style={{ background: "var(--g-cell)", border: "1px solid var(--g-border)" }}>
							<span className="text-xs truncate flex-1 font-mono" style={{ color: "var(--g-text-3)" }}>
								{getPresentationLink()}
							</span>
							<button
								onClick={() => copyLink('presentation')}
								className="shrink-0 p-1 rounded hover:opacity-80 transition-opacity"
								style={{ color: copiedLink === 'presentation' ? "var(--g-success)" : "var(--g-accent)" }}
							>
								{copiedLink === 'presentation' ? <Check size={14} /> : <Copy size={14} />}
							</button>
						</div>
					</div>

					<p className="text-sm" style={{ color: "var(--g-text-3)" }}>
						Start a new game from the home page to see it here.
					</p>
				</div>
			</div>
		);
	}

	const isWin = gameState.gameStatus === "finished" && gameState.winner;
	const isDraw = gameState.gameStatus === "finished" && !gameState.winner;
	const lastPlayerName = gameState.lastPlayer === "X" ? gameState.playerX : gameState.playerO;
	const moveCount = gameState.moveHistory.length;

	return (
		<div className="game-bg flex items-center justify-center p-6">
			<div className="w-full max-w-3xl">
				{/* Header */}
				<div className="text-center mb-8 anim-slide-up">
					<h1 className="font-extrabold tracking-tight mb-2" style={{ color: "var(--g-text)", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
						Bottle Flip XO
					</h1>
					<p className="text-sm font-medium mb-4" style={{ color: "var(--g-text-3)" }}>
						{moveCount} moves played
					</p>

					{/* Status */}
					{isWin ? (
						<div className="anim-celebrate">
							<div className="inline-flex items-center justify-center mb-3">
								<div
									className="w-24 h-24 rounded-2xl flex items-center justify-center anim-glow-pulse"
									style={{
										background: gameState.winner === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)",
										boxShadow: `0 0 50px ${gameState.winner === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}`,
									}}
								>
									<Trophy size={48} className="animate-bounce" style={{ color: "var(--g-success)" }} />
								</div>
							</div>
							<h2 
								className="font-extrabold animate-pulse" 
								style={{ 
									color: "var(--g-success)", 
									fontSize: "clamp(2rem, 5vw, 3.5rem)",
									textShadow: "0 0 30px var(--g-success)"
								}}
							>
								{gameState.winner === "X" ? gameState.playerX : gameState.playerO} Wins!
							</h2>
							<p className="text-xl font-bold mt-2" style={{ color: gameState.winner === "X" ? "var(--g-x)" : "var(--g-o)" }}>
								Playing as {gameState.winner}
							</p>
						</div>
					) : isDraw ? (
						<div>
							<div className="inline-flex items-center justify-center mb-3">
								<div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "var(--g-surface-alt)" }}>
									<Minus size={40} style={{ color: "var(--g-text-2)" }} />
								</div>
							</div>
							<h2 className="font-extrabold" style={{ color: "var(--g-text-2)", fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
								It&apos;s a Draw!
							</h2>
						</div>
					) : (
						<div>
							<div className="inline-flex items-center justify-center mb-3">
								<div
									className="w-16 h-16 rounded-xl flex items-center justify-center anim-glow-pulse"
									style={{
										background: gameState.lastPlayer === "X" ? "var(--g-o-bg)" : "var(--g-x-bg)",
										boxShadow: `0 0 25px ${gameState.lastPlayer === "X" ? "var(--g-o-glow)" : "var(--g-x-glow)"}`,
									}}
								>
									<Swords
										size={28}
										style={{
											color: gameState.lastPlayer === "X" ? "var(--g-o)" : "var(--g-x)",
										}}
									/>
								</div>
							</div>
							<h2 className="font-bold" style={{ color: "var(--g-text)", fontSize: "clamp(1.25rem, 3vw, 2rem)" }}>
								Waiting for Bottle Flip...
							</h2>
							{moveCount > 0 && (
								<p
									className="text-lg mt-1 font-semibold"
									style={{ color: "var(--g-text-2)" }}
								>
									Last move by {lastPlayerName} ({gameState.lastPlayer})
								</p>
							)}
						</div>
					)}
				</div>

				{/* Game Board */}
				<div
					className="game-surface rounded-3xl p-6 shadow-2xl mb-8"
					style={
						isWin
							? {
									boxShadow: `0 0 60px ${gameState.winner === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}`,
								}
							: undefined
					}
				>
					<div className="grid grid-cols-3 gap-4">{gameState.board.map((_, index) => renderCell(index))}</div>
				</div>

				{/* Player Info */}
				<div className="grid grid-cols-2 gap-4 mb-6">
					{/* Player X */}
					<div
						className="rounded-2xl p-5 text-center transition-all"
						style={{
							background: "var(--g-x-bg)",
							border: "3px solid var(--g-x)",
						}}
					>
						<p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--g-text-3)" }}>
							Player X
						</p>
						<p className="font-extrabold truncate mb-1" style={{ color: "var(--g-text)", fontSize: "clamp(1rem, 2.5vw, 1.75rem)" }}>
							{gameState.playerX}
						</p>
						<span className="text-3xl font-black" style={{ color: "var(--g-x)" }}>
							X
						</span>
					</div>

					{/* Player O */}
					<div
						className="rounded-2xl p-5 text-center transition-all"
						style={{
							background: "var(--g-o-bg)",
							border: "3px solid var(--g-o)",
						}}
					>
						<p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--g-text-3)" }}>
							Player O
						</p>
						<p className="font-extrabold truncate mb-1" style={{ color: "var(--g-text)", fontSize: "clamp(1rem, 2.5vw, 1.75rem)" }}>
							{gameState.playerO}
						</p>
						<span className="text-3xl font-black" style={{ color: "var(--g-o)" }}>
							O
						</span>
					</div>
				</div>

				{/* Quick Access Links */}
				<div className="game-surface rounded-xl p-4 mb-4">
					<div className="flex items-center gap-2 mb-3">
						<Link2 size={16} style={{ color: "var(--g-accent)" }} />
						<span className="text-sm font-bold" style={{ color: "var(--g-text)" }}>Quick Access Links</span>
					</div>
					<div className="space-y-2">
						{/* Player X Link */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold shrink-0" style={{ color: "var(--g-x)", width: "80px" }}>
								{gameState.playerX} (X):
							</span>
							<div className="flex-1 flex items-center gap-1 p-2 rounded-lg overflow-hidden" style={{ background: "var(--g-cell)", border: "1px solid var(--g-border)" }}>
								<span className="text-xs truncate flex-1 font-mono" style={{ color: "var(--g-text-3)" }}>
									{getPlayerXLink()}
								</span>
								<button
									onClick={() => copyLink('x')}
									className="shrink-0 p-1 rounded hover:opacity-80 transition-opacity"
									style={{ color: copiedLink === 'x' ? "var(--g-success)" : "var(--g-accent)" }}
								>
									{copiedLink === 'x' ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						</div>
						{/* Player O Link */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold shrink-0" style={{ color: "var(--g-o)", width: "80px" }}>
								{gameState.playerO} (O):
							</span>
							<div className="flex-1 flex items-center gap-1 p-2 rounded-lg overflow-hidden" style={{ background: "var(--g-cell)", border: "1px solid var(--g-border)" }}>
								<span className="text-xs truncate flex-1 font-mono" style={{ color: "var(--g-text-3)" }}>
									{getPlayerOLink()}
								</span>
								<button
									onClick={() => copyLink('o')}
									className="shrink-0 p-1 rounded hover:opacity-80 transition-opacity"
									style={{ color: copiedLink === 'o' ? "var(--g-success)" : "var(--g-accent)" }}
								>
									{copiedLink === 'o' ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						</div>
						{/* Presentation Link */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold shrink-0" style={{ color: "var(--g-accent)", width: "80px" }}>
								Presentation:
							</span>
							<div className="flex-1 flex items-center gap-1 p-2 rounded-lg overflow-hidden" style={{ background: "var(--g-cell)", border: "1px solid var(--g-border)" }}>
								<span className="text-xs truncate flex-1 font-mono" style={{ color: "var(--g-text-3)" }}>
									{getPresentationLink()}
								</span>
								<button
									onClick={() => copyLink('presentation')}
									className="shrink-0 p-1 rounded hover:opacity-80 transition-opacity"
									style={{ color: copiedLink === 'presentation' ? "var(--g-success)" : "var(--g-accent)" }}
								>
									{copiedLink === 'presentation' ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Control Buttons */}
				<div className="flex gap-3 mb-4">
					<button
						onClick={handleUndo}
						disabled={undoing || gameState.moveHistory.length === 0}
						className="flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
						style={{ 
							background: "var(--g-surface-alt)", 
							color: "var(--g-text)",
							border: "2px solid var(--g-border)",
						}}
					>
						{undoing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />}
						{undoing ? "Undoing..." : `Undo Last Move${moveCount > 0 ? ` (${moveCount})` : ''}`}
					</button>
					<button
						onClick={handleReset}
						disabled={resetting}
						className="flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
						style={{ 
							background: "var(--g-accent)", 
							color: "white",
							boxShadow: "0 0 15px var(--g-glow)"
						}}
					>
						{resetting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
						{resetting ? "Resetting..." : "Reset Game"}
					</button>
				</div>
				<div className="flex gap-3 mb-4">
					<button
						onClick={handleDeleteAll}
						disabled={deletingAll}
						className="flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
						style={{ 
							background: "var(--g-danger)", 
							color: "white",
						}}
					>
						{deletingAll ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
						{deletingAll ? "Deleting..." : "Delete All Games"}
					</button>
				</div>

				{/* Status Bar */}
				<div className="text-center">
					<p className="text-xs font-medium" style={{ color: "var(--g-text-3)" }}>
						Live &bull; Updated {lastUpdated.toLocaleTimeString()}
					</p>
				</div>
			</div>
		</div>
	);
}
