"use client";

import { useState } from "react";
import { Mark } from "@/lib/game";
import { Sparkles, Home } from "lucide-react";

interface MarkSelectionProps {
	playerName: string;
	opponentName: string;
	onMarkSelected: (mark: Mark, playerName: string, opponentName: string) => void;
	onQuit?: () => void;
}

export function MarkSelection({ playerName, opponentName, onMarkSelected, onQuit }: MarkSelectionProps) {
	const [selectedMark, setSelectedMark] = useState<Mark | null>(null);
	const [hoveredMark, setHoveredMark] = useState<Mark | null>(null);

	const handleSelect = (mark: Mark) => {
		setSelectedMark(mark);
		onMarkSelected(mark, playerName, opponentName);
	};

	return (
		<div className="game-bg flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8 anim-slide-up">
					<div className="inline-flex items-center justify-center mb-3 anim-float">
						<div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "var(--g-accent-bg)", color: "var(--g-accent)" }}>
							<Sparkles size={28} />
						</div>
					</div>
					<h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--g-text)" }}>
						Choose Your Mark
					</h1>
					<p className="text-base" style={{ color: "var(--g-text-2)" }}>
						<span className="font-semibold">{playerName}</span> <span style={{ color: "var(--g-text-3)" }}>vs</span> <span className="font-semibold">{opponentName}</span>
					</p>
				</div>

				{/* Mark Buttons */}
				<div className="grid grid-cols-2 gap-5 mb-6 anim-slide-up" style={{ animationDelay: "0.1s" }}>
					{/* X Button */}
					<button
						onClick={() => handleSelect("X")}
						onMouseEnter={() => setHoveredMark("X")}
						onMouseLeave={() => setHoveredMark(null)}
						className={`
              relative rounded-2xl p-8 flex flex-col items-center justify-center gap-3
              transition-all duration-300 cursor-pointer group
              ${selectedMark === "X" ? "scale-105" : "hover:scale-105"}
            `}
						style={{
							background: selectedMark === "X" || hoveredMark === "X" ? "var(--g-x-bg)" : "var(--g-surface)",
							border: `3px solid ${selectedMark === "X" ? "var(--g-x)" : "var(--g-border)"}`,
							boxShadow: selectedMark === "X" || hoveredMark === "X" ? "0 0 30px var(--g-x-glow)" : "none",
						}}
					>
						<span className="text-7xl font-black" style={{ color: "var(--g-x)" }}>
							X
						</span>
						<span className="text-sm font-semibold uppercase tracking-wider" style={{ color: selectedMark === "X" ? "var(--g-x)" : "var(--g-text-2)" }}>
							Cross
						</span>
					</button>

					{/* O Button */}
					<button
						onClick={() => handleSelect("O")}
						onMouseEnter={() => setHoveredMark("O")}
						onMouseLeave={() => setHoveredMark(null)}
						className={`
              relative rounded-2xl p-8 flex flex-col items-center justify-center gap-3
              transition-all duration-300 cursor-pointer group
              ${selectedMark === "O" ? "scale-105" : "hover:scale-105"}
            `}
						style={{
							background: selectedMark === "O" || hoveredMark === "O" ? "var(--g-o-bg)" : "var(--g-surface)",
							border: `3px solid ${selectedMark === "O" ? "var(--g-o)" : "var(--g-border)"}`,
							boxShadow: selectedMark === "O" || hoveredMark === "O" ? "0 0 30px var(--g-o-glow)" : "none",
						}}
					>
						<span className="text-7xl font-black" style={{ color: "var(--g-o)" }}>
							O
						</span>
						<span className="text-sm font-semibold uppercase tracking-wider" style={{ color: selectedMark === "O" ? "var(--g-o)" : "var(--g-text-2)" }}>
							Circle
						</span>
					</button>
				</div>

				{/* Hint */}
				<div className="text-center anim-slide-up" style={{ animationDelay: "0.2s" }}>
					<p className="text-sm" style={{ color: "var(--g-text-3)" }}>
						Tap a mark to begin the battle
					</p>
				</div>

				{onQuit && (
					<div className="text-center mt-6 anim-slide-up" style={{ animationDelay: "0.25s" }}>
						<button
							onClick={onQuit}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
							style={{ color: "var(--g-text-3)", border: "1px solid var(--g-border)" }}
						>
							<Home size={16} />
							Back to Home
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
