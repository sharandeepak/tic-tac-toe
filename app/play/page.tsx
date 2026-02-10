"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MarkSelection } from "@/components/MarkSelection";
import { GameBoard } from "@/components/GameBoard";
import { GameState, Mark } from "@/lib/game";
import { createNewGame, getGameState, makeGameMove, subscribeToGame, resetGame, deleteGame } from "@/lib/gameService";
import { database } from "@/lib/firebase";
import { ref, set, get, remove } from "firebase/database";
import { Copy, Check, ArrowRight, Share2, Link2, Gamepad2, FlaskConical, Trash2, CheckCircle2, XCircle, Loader2, LogOut, Home } from "lucide-react";

const GAME_ID = "tic-tac-toe-game";

interface PlayerState {
	playerName: string;
	opponentName: string;
	mark: Mark;
}

function FirebaseTestPanel() {
	const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [testData, setTestData] = useState<any>(null);
	const [errorMsg, setErrorMsg] = useState("");

	const handleTestWrite = async () => {
		setTestStatus("loading");
		setTestData(null);
		setErrorMsg("");
		try {
			const testRef = ref(database, "connectionTest");
			const testPayload = {
				message: "Firebase is connected!",
				timestamp: Date.now(),
				createdAt: new Date().toISOString(),
			};
			await set(testRef, testPayload);

			// Now read it back
			const snapshot = await get(testRef);
			if (snapshot.exists()) {
				setTestData(snapshot.val());
				setTestStatus("success");
			} else {
				setErrorMsg("Write succeeded but read returned empty. Check Firebase rules.");
				setTestStatus("error");
			}
		} catch (err: any) {
			console.error("Firebase test error:", err);
			setErrorMsg(err.message || "Unknown error");
			setTestStatus("error");
		}
	};

	const handleTestDelete = async () => {
		try {
			await remove(ref(database, "connectionTest"));
			setTestData(null);
			setTestStatus("idle");
		} catch (err: any) {
			console.error("Firebase delete error:", err);
			setErrorMsg(err.message || "Failed to delete");
			setTestStatus("error");
		}
	};

	return (
		<div className="game-surface rounded-2xl p-5 shadow-lg mb-6 anim-slide-up" style={{ border: "2px dashed var(--g-border)" }}>
			<div className="flex items-center gap-2 mb-3">
				<FlaskConical size={18} style={{ color: "var(--g-accent)" }} />
				<h3 className="text-sm font-bold" style={{ color: "var(--g-text)" }}>
					Firebase Connection Test
				</h3>
			</div>

			<div className="flex gap-2 mb-3">
				<button
					onClick={handleTestWrite}
					disabled={testStatus === "loading"}
					className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
					style={{
						background: "var(--g-accent)",
						color: "white",
						opacity: testStatus === "loading" ? 0.6 : 1,
					}}
				>
					{testStatus === "loading" ? (
						<>
							<Loader2 size={14} className="animate-spin" />
							Testing...
						</>
					) : (
						<>
							<FlaskConical size={14} />
							Write &amp; Read Test
						</>
					)}
				</button>
				{testData && (
					<button
						onClick={handleTestDelete}
						className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
						style={{
							background: "var(--g-surface-alt)",
							color: "var(--g-danger)",
							border: "1px solid var(--g-border)",
						}}
					>
						<Trash2 size={14} />
						Delete
					</button>
				)}
			</div>

			{testStatus === "success" && testData && (
				<div
					className="rounded-xl p-3 text-sm"
					style={{
						background: "rgba(16, 185, 129, 0.1)",
						border: "1px solid rgba(16, 185, 129, 0.3)",
					}}
				>
					<div className="flex items-center gap-2 mb-2">
						<CheckCircle2 size={16} style={{ color: "var(--g-success)" }} />
						<span className="font-bold" style={{ color: "var(--g-success)" }}>
							Connected! Data written &amp; read back:
						</span>
					</div>
					<pre className="text-xs overflow-auto font-mono p-2 rounded-lg" style={{ background: "var(--g-cell)", color: "var(--g-text-2)" }}>
						{JSON.stringify(testData, null, 2)}
					</pre>
				</div>
			)}

			{testStatus === "error" && (
				<div
					className="rounded-xl p-3 text-sm"
					style={{
						background: "rgba(239, 68, 68, 0.1)",
						border: "1px solid rgba(239, 68, 68, 0.3)",
					}}
				>
					<div className="flex items-center gap-2 mb-1">
						<XCircle size={16} style={{ color: "var(--g-danger)" }} />
						<span className="font-bold" style={{ color: "var(--g-danger)" }}>
							Connection Failed
						</span>
					</div>
					<p className="text-xs" style={{ color: "var(--g-text-2)" }}>
						{errorMsg}
					</p>
					<p className="text-xs mt-2" style={{ color: "var(--g-text-3)" }}>
						Check: 1) Firebase Realtime Database exists in your project 2) Database rules allow read/write 3) databaseURL is correct in firebase.ts
					</p>
				</div>
			)}
		</div>
	);
}

function PlayContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [playerState, setPlayerState] = useState<PlayerState | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);
	const [showShareScreen, setShowShareScreen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [initError, setInitError] = useState("");
	const [quitting, setQuitting] = useState(false);

	// Initialize game and player name from URL params
	useEffect(() => {
		const playerName = searchParams.get("player") || "Player";
		const opponentName = searchParams.get("opponent") || "Opponent";

		const checkGame = async () => {
			try {
				const existing = await getGameState(GAME_ID);
				if (existing) {
					setGameState(existing);
					// Derive mark from the game state: match playerName to playerX/playerO
					const myMark: Mark = existing.playerX === playerName ? "X" : "O";
					setPlayerState({
						playerName,
						opponentName,
						mark: myMark,
					});
					setGameStarted(true);
				}
			} catch (error) {
				console.error("Error checking game:", error);
			}
		};

		checkGame();
	}, [searchParams]);

	// Subscribe to game state changes
	useEffect(() => {
		if (!gameStarted || !playerState) return;

		const unsubscribe = subscribeToGame(GAME_ID, (state) => {
			if (state) {
				setGameState(state);
			}
		});

		return () => unsubscribe();
	}, [gameStarted, playerState]);

	const handleMarkSelected = async (mark: Mark, playerName: string, opponentName: string) => {
		setIsLoading(true);
		setInitError("");
		try {
			const existingGame = await getGameState(GAME_ID);

			if (!existingGame) {
				const xPlayer = mark === "X" ? playerName : opponentName;
				const oPlayer = mark === "X" ? opponentName : playerName;
				await createNewGame(xPlayer, oPlayer);
			}

			// Read the game state to confirm it was created
			const confirmedState = await getGameState(GAME_ID);
			if (confirmedState) {
				setGameState(confirmedState);
			}

			setPlayerState({
				playerName,
				opponentName,
				mark,
			});
			setGameStarted(true);
			setShowShareScreen(true);
		} catch (error: any) {
			console.error("Error starting game:", error);
			setInitError(error.message || "Failed to create game. Check Firebase connection.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyLink = async () => {
		const playerName = searchParams.get("player") || "Player";
		const opponentName = searchParams.get("opponent") || "Opponent";

		// Generate link for opponent with swapped names
		const params = new URLSearchParams({
			player: opponentName,
			opponent: playerName,
		});
		const link = `${window.location.origin}/play?${params.toString()}`;

		try {
			await navigator.clipboard.writeText(link);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch {
			// Fallback
			const textarea = document.createElement("textarea");
			textarea.value = link;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		}
	};

	const handleCellClick = async (index: number, action: 'place' | 'replace' = 'place') => {
		if (!playerState || !gameState) return;

		setIsLoading(true);
		try {
			const success = await makeGameMove(GAME_ID, index, playerState.mark, action);
			if (!success) {
				console.error("Invalid move");
			}
		} catch (error) {
			console.error("Error making move:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleReset = async () => {
		try {
			await resetGame(GAME_ID);
			setGameState(null);
			setPlayerState(null);
			setGameStarted(false);
			setShowShareScreen(false);
		} catch (error) {
			console.error("Error resetting game:", error);
		}
	};

	/** Quit game: delete from Firebase (if any) and go home. Use when stuck or when you lost the link. */
	const handleQuitGame = async () => {
		setQuitting(true);
		try {
			await deleteGame(GAME_ID);
		} catch (error) {
			console.error("Error deleting game:", error);
		}
		setGameState(null);
		setPlayerState(null);
		setGameStarted(false);
		setShowShareScreen(false);
		setQuitting(false);
		router.push("/");
	};

	// Step 1: Mark Selection
	if (!gameStarted || !playerState) {
		return (
			<div>
				<MarkSelection
					playerName={searchParams.get("player") || "Player"}
					opponentName={searchParams.get("opponent") || "Opponent"}
					onMarkSelected={handleMarkSelected}
					onQuit={() => router.push("/")}
				/>
				{isLoading && (
					<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
						<div className="game-surface rounded-2xl p-6 flex items-center gap-3 shadow-xl">
							<Loader2 size={20} className="animate-spin" style={{ color: "var(--g-accent)" }} />
							<span style={{ color: "var(--g-text)" }}>Creating game...</span>
						</div>
					</div>
				)}
				{initError && (
					<div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
						<div className="rounded-xl p-4 shadow-lg" style={{ background: "rgba(239, 68, 68, 0.95)", color: "white" }}>
							<div className="flex items-center gap-2 mb-1">
								<XCircle size={16} />
								<span className="font-bold text-sm">Error Creating Game</span>
							</div>
							<p className="text-xs opacity-90">{initError}</p>
						</div>
					</div>
				)}
				{/* Firebase Test Panel */}
				<div className="fixed bottom-4 right-4 z-40">
					<FirebaseTestPanel />
				</div>
			</div>
		);
	}

	// Step 2: Share Link Screen
	if (showShareScreen) {
		const opponentMark = playerState.mark === "X" ? "O" : "X";
		return (
			<div className="game-bg flex items-center justify-center p-4">
				<div className="w-full max-w-md">
					{/* Success Header */}
					<div className="text-center mb-8 anim-slide-up">
						<div className="inline-flex items-center justify-center mb-4 anim-float">
							<div
								className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
								style={{
									background: playerState.mark === "X" ? "var(--g-x-bg)" : "var(--g-o-bg)",
									boxShadow: playerState.mark === "X" ? "0 0 30px var(--g-x-glow)" : "0 0 30px var(--g-o-glow)",
								}}
							>
								<span className="text-4xl font-black" style={{ color: playerState.mark === "X" ? "var(--g-x)" : "var(--g-o)" }}>
									{playerState.mark}
								</span>
							</div>
						</div>
						<h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--g-text)" }}>
							Game Created!
						</h1>
						<p style={{ color: "var(--g-text-2)" }}>
							You are playing as{" "}
							<span className="font-bold" style={{ color: playerState.mark === "X" ? "var(--g-x)" : "var(--g-o)" }}>
								{playerState.mark}
							</span>
						</p>
					</div>

					{/* Share Card */}
					<div className="game-surface rounded-3xl p-6 shadow-xl mb-6 anim-slide-up" style={{ animationDelay: "0.1s" }}>
						<div className="flex items-center gap-2 mb-4">
							<Share2 size={20} style={{ color: "var(--g-accent)" }} />
							<h2 className="text-lg font-bold" style={{ color: "var(--g-text)" }}>
								Share with {playerState.opponentName}
							</h2>
						</div>

						<p className="text-sm mb-4" style={{ color: "var(--g-text-2)" }}>
							Send this link to <span className="font-semibold">{playerState.opponentName}</span> so they can join as{" "}
							<span className="font-bold" style={{ color: opponentMark === "X" ? "var(--g-x)" : "var(--g-o)" }}>
								{opponentMark}
							</span>
						</p>

						{/* Link Display */}
						<div className="flex items-center gap-2 p-3 rounded-xl mb-4 overflow-hidden" style={{ background: "var(--g-cell)", border: "1px solid var(--g-border)" }}>
							<Link2 size={16} className="shrink-0" style={{ color: "var(--g-text-3)" }} />
							<span className="text-xs truncate flex-1 font-mono" style={{ color: "var(--g-text-2)" }}>
								{typeof window !== "undefined" ? `${window.location.origin}/play?player=${encodeURIComponent(playerState.opponentName)}&opponent=${encodeURIComponent(playerState.playerName)}` : "..."}
							</span>
						</div>

						{/* Copy Button */}
						<button
							onClick={handleCopyLink}
							className="w-full px-5 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300"
							style={{
								background: copied ? "var(--g-success)" : "var(--g-accent)",
								color: "white",
								boxShadow: copied ? "0 0 20px rgba(16, 185, 129, 0.3)" : "0 0 20px var(--g-glow)",
							}}
						>
							{copied ? (
								<>
									<Check size={20} />
									Link Copied!
								</>
							) : (
								<>
									<Copy size={20} />
									Copy Invite Link
								</>
							)}
						</button>
					</div>

					{/* Continue Button */}
					<button onClick={() => setShowShareScreen(false)} className="game-btn-primary w-full px-6 py-4 rounded-xl text-lg flex items-center justify-center gap-2 anim-slide-up" style={{ animationDelay: "0.2s" }}>
						<Gamepad2 size={22} />
						Start Playing
						<ArrowRight size={20} />
					</button>

					{/* Quit & Delete Game */}
					<button
						onClick={handleQuitGame}
						disabled={quitting}
						className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all opacity-80 hover:opacity-100 disabled:opacity-50"
						style={{ color: "var(--g-text-3)", border: "1px solid var(--g-border)" }}
					>
						{quitting ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
						{quitting ? "Quitting..." : "Quit & Delete Game"}
					</button>
				</div>
			</div>
		);
	}

	// Step 3: Loading game state
	if (!gameState) {
		return (
			<div className="game-bg flex items-center justify-center">
				<div className="text-center anim-slide-up">
					<div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 anim-glow-pulse" style={{ background: "var(--g-accent-bg)", color: "var(--g-accent)" }}>
						<Gamepad2 size={32} />
					</div>
					<p className="text-lg font-medium" style={{ color: "var(--g-text-2)" }}>
						Loading game...
					</p>
				</div>
			</div>
		);
	}

	// Step 4: Game Board
	return (
		<div>
			<GameBoard
				gameState={gameState}
				playerMark={playerState.mark}
				onCellClick={handleCellClick}
				isLoading={isLoading}
				onQuit={handleQuitGame}
				quitting={quitting}
				gameId={GAME_ID}
			/>

			{gameState.gameStatus === "finished" && (
				<div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 anim-slide-up">
					<button onClick={handleReset} className="game-btn-primary px-8 py-4 rounded-xl font-bold text-lg shadow-2xl flex items-center gap-2">
						<Gamepad2 size={22} />
						Play Again
					</button>
				</div>
			)}
		</div>
	);
}

export default function PlayPage() {
	return (
		<Suspense
			fallback={
				<div className="game-bg flex items-center justify-center">
					<div className="text-center">
						<p className="text-lg" style={{ color: "var(--g-text-2)" }}>
							Loading...
						</p>
					</div>
				</div>
			}
		>
			<PlayContent />
		</Suspense>
	);
}
