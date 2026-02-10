"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameState, Mark, CellValue } from "@/lib/game";
import { Swords, Trophy, Minus, Loader2, LogOut, Link2, Copy, Check, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";

interface GameBoardProps {
	gameState: GameState;
	playerMark: Mark;
	onCellClick: (index: number, action: 'place' | 'replace') => void;
	isLoading?: boolean;
	onQuit?: () => void;
	quitting?: boolean;
	gameId: string;
}

export function GameBoard({ gameState, playerMark, onCellClick, isLoading = false, onQuit, quitting = false, gameId }: GameBoardProps) {
	const opponent: Mark = playerMark === "X" ? "O" : "X";
	const opponentName = opponent === "X" ? gameState.playerX : gameState.playerO;
	const playerName = playerMark === "X" ? gameState.playerX : gameState.playerO;

	// Track which cells just got filled for animation
	const [animatingCells, setAnimatingCells] = useState<Set<number>>(new Set());
	const prevBoard = useRef<CellValue[]>(gameState.board);
	const [copiedLink, setCopiedLink] = useState<'player' | 'opponent' | null>(null);
	const [showWinAnimation, setShowWinAnimation] = useState(false);
	const confettiTriggered = useRef(false);

	// Confetti effect when winning
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

	// Trigger confetti when player wins
	useEffect(() => {
		const playerWon = gameState.gameStatus === "finished" && gameState.winner === playerMark;
		if (playerWon && !confettiTriggered.current) {
			confettiTriggered.current = true;
			setShowWinAnimation(true);
			fireConfetti();
			// Fire confetti multiple times for more celebration
			setTimeout(() => fireConfetti(), 300);
			setTimeout(() => fireConfetti(), 600);
		}
	}, [gameState.gameStatus, gameState.winner, playerMark, fireConfetti]);

	useEffect(() => {
		const newAnims = new Set<number>();
		gameState.board.forEach((val, i) => {
			if ((val === "X" || val === "O") && prevBoard.current[i] !== val) {
				newAnims.add(i);
			}
		});
		if (newAnims.size > 0) {
			setAnimatingCells(newAnims);
			const timer = setTimeout(() => setAnimatingCells(new Set()), 600);
			return () => clearTimeout(timer);
		}
		prevBoard.current = gameState.board;
	}, [gameState.board]);

	// Generate links
	const getPlayerLink = () => {
		if (typeof window === "undefined") return "";
		const params = new URLSearchParams({
			player: playerName,
			opponent: opponentName,
		});
		return `${window.location.origin}/play?${params.toString()}`;
	};

	const getOpponentLink = () => {
		if (typeof window === "undefined") return "";
		const params = new URLSearchParams({
			player: opponentName,
			opponent: playerName,
		});
		return `${window.location.origin}/play?${params.toString()}`;
	};

	const copyLink = async (type: 'player' | 'opponent') => {
		const link = type === 'player' ? getPlayerLink() : getOpponentLink();
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
		const value = gameState.board[index];
		const hasMark = value === "X" || value === "O";
		const isOpponentMark = value === opponent;
		const isAnimating = animatingCells.has(index);
		const isFinished = gameState.gameStatus === "finished";
		
		// No turn enforcement: player can always click when game is active
		// - Empty cells: always clickable
		// - Opponent's marks: always clickable (can replace anytime)
		const canClickEmpty = !isFinished && !isLoading && value === "";
		const canClickReplace = !isFinished && !isLoading && isOpponentMark;
		const canClick = canClickEmpty || canClickReplace;

		const handleClick = () => {
			if (!canClick) return;
			if (value === "") {
				onCellClick(index, 'place');
			} else if (isOpponentMark) {
				onCellClick(index, 'replace');
			}
		};

		return (
			<button
				key={index}
				onClick={handleClick}
				disabled={!canClick}
				data-filled={hasMark}
				className={`
          game-cell w-full aspect-square rounded-2xl font-black text-5xl
          flex items-center justify-center relative
          ${canClick ? "cursor-pointer" : "cursor-default"}
          ${isLoading ? "opacity-60" : ""}
          ${canClickReplace ? "hover:opacity-70" : ""}
        `}
				style={
					hasMark
						? {
								background: value === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)",
								borderColor: value === "X" ? "var(--g-x)" : "var(--g-o)",
								boxShadow: `0 0 15px ${value === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}`,
							}
						: undefined
				}
				title={canClickReplace ? `Click to replace ${opponent} with ${playerMark}` : canClickEmpty ? `Click to place ${playerMark}` : undefined}
			>
				{hasMark && (
					<span className={isAnimating ? "anim-cell-pop" : ""} style={{ color: value === "X" ? "var(--g-x)" : "var(--g-o)" }}>
						{value}
					</span>
				)}
				{canClickReplace && (
					<div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
						<Trash2 size={24} style={{ color: "var(--g-danger)" }} />
					</div>
				)}
			</button>
		);
	};

	const isWin = gameState.gameStatus === "finished" && gameState.winner !== "";
	const isDraw = gameState.gameStatus === "finished" && gameState.winner === "";
	const playerWon = gameState.winner !== "" && gameState.winner === playerMark;
	const winnerName = gameState.winner === "X" ? gameState.playerX : gameState.playerO;

	return (
		<div className="game-bg flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-md relative">
				{/* Quit Game - top right */}
				{onQuit && (
					<div className="absolute -top-1 right-0">
						<button
							onClick={onQuit}
							disabled={quitting}
							className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
							style={{ color: "var(--g-text-3)", border: "1px solid var(--g-border)", background: "var(--g-surface)" }}
						>
							{quitting ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
							{quitting ? "Quitting..." : "Quit Game"}
						</button>
					</div>
				)}

				{/* Game Status Header */}
				<div className="text-center mb-6 anim-slide-up">
					{isWin ? (
						<div className={playerWon ? "anim-celebrate" : ""}>
							<div className="inline-flex items-center justify-center mb-3">
								<div
									className={`w-20 h-20 rounded-2xl flex items-center justify-center ${playerWon ? "anim-glow-pulse" : ""}`}
									style={{
										background: gameState.winner === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)",
										boxShadow: `0 0 40px ${gameState.winner === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}`,
									}}
								>
									<Trophy size={40} className={playerWon ? "animate-bounce" : ""} style={{ color: "var(--g-success)" }} />
								</div>
							</div>
							<h2 
								className={`text-3xl font-extrabold mb-2 ${playerWon ? "animate-pulse" : ""}`} 
								style={{ 
									color: "var(--g-success)",
									textShadow: playerWon ? "0 0 20px var(--g-success)" : "none"
								}}
							>
								{winnerName} Wins!
							</h2>
							<p className="text-lg font-bold" style={{ color: gameState.winner === "X" ? "var(--g-x)" : "var(--g-o)" }}>
								Playing as {gameState.winner}
							</p>
						</div>
					) : isDraw ? (
						<div>
							<div className="inline-flex items-center justify-center mb-3">
								<div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--g-surface-alt)" }}>
									<Minus size={32} style={{ color: "var(--g-text-2)" }} />
								</div>
							</div>
							<h2 className="text-2xl font-extrabold" style={{ color: "var(--g-text-2)" }}>
								It&apos;s a Draw!
							</h2>
						</div>
					) : (
						<div>
							<div className="inline-flex items-center justify-center mb-3">
								<div
									className="w-14 h-14 rounded-xl flex items-center justify-center anim-glow-pulse"
									style={{
										background: playerMark === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)",
										boxShadow: `0 0 20px ${playerMark === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}`,
									}}
								>
									<Swords
										size={24}
										style={{
											color: "var(--g-accent)",
										}}
									/>
								</div>
							</div>
							<h2 className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
								Flip & Place!
							</h2>
							<p className="text-sm mt-1" style={{ color: "var(--g-text-2)" }}>
								Playing as{" "}
								<span className="font-bold" style={{ color: playerMark === "X" ? "var(--g-x)" : "var(--g-o)" }}>
									{playerMark}
								</span>
							</p>
						</div>
					)}
				</div>

				{/* Game Grid */}
				<div
					className="game-surface rounded-3xl p-5 shadow-xl mb-6"
					style={
						gameState.gameStatus === "finished" && gameState.winner
							? {
									boxShadow: `0 0 40px ${gameState.winner === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}`,
								}
							: undefined
					}
				>
					<div className="grid grid-cols-3 gap-3">{gameState.board.map((_, index) => renderCell(index))}</div>
				</div>

				{/* Player Info Cards */}
				<div className="grid grid-cols-2 gap-3">
					{/* Current Player Card */}
					<div
						className="rounded-2xl p-4 text-center transition-all"
						style={{
							background: playerMark === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)",
							border: `2px solid ${playerMark === "X" ? "var(--g-x)" : "var(--g-o)"}`,
							boxShadow: `0 0 15px ${playerMark === "X" ? "var(--g-x-glow)" : "var(--g-o-glow)"}`,
						}}
					>
						<p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--g-text-3)" }}>
							You
						</p>
						<p className="font-bold text-sm truncate" style={{ color: "var(--g-text)" }}>
							{playerName}
						</p>
						<span className="text-2xl font-black" style={{ color: playerMark === "X" ? "var(--g-x)" : "var(--g-o)" }}>
							{playerMark}
						</span>
					</div>

					{/* Opponent Card */}
					<div
						className="rounded-2xl p-4 text-center transition-all"
						style={{
							background: opponent === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)",
							border: `2px solid transparent`,
						}}
					>
						<p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--g-text-3)" }}>
							Opponent
						</p>
						<p className="font-bold text-sm truncate" style={{ color: "var(--g-text)" }}>
							{opponentName}
						</p>
						<span className="text-2xl font-black" style={{ color: opponent === "X" ? "var(--g-x)" : "var(--g-o)" }}>
							{opponent}
						</span>
					</div>
				</div>

				{/* Game Rules Helper */}
				{!isWin && !isDraw && (
					<div className="mt-4 p-3 rounded-xl text-center" style={{ background: "var(--g-surface-alt)", border: "1px dashed var(--g-border)" }}>
						<p className="text-xs font-medium" style={{ color: "var(--g-text-2)" }}>
							<span className="font-bold" style={{ color: "var(--g-accent)" }}>Bottle Flip XO:</span>{" "}
							Flip the bottle! Place on empty cells or replace opponent&apos;s marks
						</p>
					</div>
				)}

				{/* Quick Access Links */}
				<div className="mt-4 game-surface rounded-xl p-4">
					<div className="flex items-center gap-2 mb-3">
						<Link2 size={16} style={{ color: "var(--g-accent)" }} />
						<span className="text-sm font-bold" style={{ color: "var(--g-text)" }}>Quick Access Links</span>
					</div>
					<div className="space-y-2">
						{/* Your Link */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold shrink-0" style={{ color: playerMark === "X" ? "var(--g-x)" : "var(--g-o)", width: "60px" }}>
								Your Link:
							</span>
							<div className="flex-1 flex items-center gap-1 p-2 rounded-lg overflow-hidden" style={{ background: "var(--g-cell)", border: "1px solid var(--g-border)" }}>
								<span className="text-xs truncate flex-1 font-mono" style={{ color: "var(--g-text-3)" }}>
									{getPlayerLink()}
								</span>
								<button
									onClick={() => copyLink('player')}
									className="shrink-0 p-1 rounded hover:opacity-80 transition-opacity"
									style={{ color: copiedLink === 'player' ? "var(--g-success)" : "var(--g-accent)" }}
								>
									{copiedLink === 'player' ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						</div>
						{/* Opponent Link */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold shrink-0" style={{ color: opponent === "X" ? "var(--g-x)" : "var(--g-o)", width: "60px" }}>
								{opponentName}:
							</span>
							<div className="flex-1 flex items-center gap-1 p-2 rounded-lg overflow-hidden" style={{ background: "var(--g-cell)", border: "1px solid var(--g-border)" }}>
								<span className="text-xs truncate flex-1 font-mono" style={{ color: "var(--g-text-3)" }}>
									{getOpponentLink()}
								</span>
								<button
									onClick={() => copyLink('opponent')}
									className="shrink-0 p-1 rounded hover:opacity-80 transition-opacity"
									style={{ color: copiedLink === 'opponent' ? "var(--g-success)" : "var(--g-accent)" }}
								>
									{copiedLink === 'opponent' ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Loading indicator */}
				{isLoading && (
					<div className="flex items-center justify-center gap-2 mt-4">
						<Loader2 size={16} className="animate-spin" style={{ color: "var(--g-accent)" }} />
						<span className="text-sm" style={{ color: "var(--g-text-3)" }}>
							Processing...
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
