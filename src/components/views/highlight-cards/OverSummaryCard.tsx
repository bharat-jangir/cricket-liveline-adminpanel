import { Card, CardContent } from "../../ui/card";

interface OverSummaryCardProps {
    overNumber: number;
    bowlerName: string;
    runs: number;
    wickets: number;
    ballsData: string[];
    commentary: string;
    onCommentaryChange?: (commentary: string) => void;
    // New Rich Stats
    matchScore?: string;
    matchOvers?: string;
    batsman1?: { name: string; display: string };
    batsman2?: { name: string; display: string };
    bowler?: { name: string; display: string };
}

export function OverSummaryCard({
    overNumber,
    bowlerName,
    runs,
    wickets,
    ballsData,
    commentary,
    onCommentaryChange,
    matchScore,
    matchOvers,
    batsman1,
    batsman2,
    bowler,
}: OverSummaryCardProps) {
    return (
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <CardContent className="p-0">
                {/* Header with Match Score */}
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                            Over {overNumber}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">
                            End of Over
                        </span>
                    </div>
                    {matchScore && (
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-lg">{matchScore}</span>
                            <span className="text-slate-500 text-xs">({matchOvers} ov)</span>
                        </div>
                    )}
                </div>

                <div className="p-4 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Batsmen Stats */}
                        <div className="space-y-2 border-r border-slate-800 pr-4">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Batsmen</div>
                            {batsman1 && (
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-slate-300 text-sm truncate max-w-[100px]">{batsman1.name}</span>
                                    <span className="text-white font-mono font-bold text-sm tracking-tighter">{batsman1.display}</span>
                                </div>
                            )}
                            {batsman2 && (
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-slate-300 text-sm truncate max-w-[100px]">{batsman2.name}</span>
                                    <span className="text-white font-mono font-bold text-sm tracking-tighter">{batsman2.display}</span>
                                </div>
                            )}
                        </div>

                        {/* Bowler Stats */}
                        <div className="space-y-2">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Bowler</div>
                            {bowler ? (
                                <div className="flex flex-col px-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-400 text-sm font-medium truncate max-w-[100px]">{bowler.name}</span>
                                        <span className="text-white font-mono font-bold text-sm tracking-tighter">{bowler.display}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        Over summary: {runs} runs, {wickets} wkts
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-300 text-sm font-medium px-1">{bowlerName}</div>
                            )}
                        </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex gap-1.5 justify-center py-2 bg-slate-950/50 rounded-lg">
                        {ballsData.map((ball, index) => {
                            const isWicket = ball.includes("W") || ball === "W";
                            const isFour = ball === "4";
                            const isSix = ball === "6";
                            const isDot = ball === "0" || ball === "•";

                            let colorClass = "bg-slate-700 text-slate-300";
                            if (isWicket) colorClass = "bg-red-500 text-white shadow-lg shadow-red-900/20";
                            if (isFour) colorClass = "bg-blue-500 text-white shadow-lg shadow-blue-900/20";
                            if (isSix) colorClass = "bg-purple-500 text-white shadow-lg shadow-purple-900/20";
                            if (isDot) colorClass = "bg-slate-800 text-slate-500";

                            return (
                                <div
                                    key={index}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${colorClass}`}
                                >
                                    {ball}
                                </div>
                            );
                        })}
                    </div>

                    {/* Commentary */}
                    {onCommentaryChange ? (
                        <div className="relative group">
                            <textarea
                                className="w-full p-3 bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-700 resize-none min-h-[60px]"
                                value={commentary}
                                onChange={(e) => onCommentaryChange(e.target.value)}
                                placeholder="Add over final summary commentary..."
                                rows={2}
                            />
                        </div>
                    ) : (
                        commentary && (
                            <p className="text-slate-400 text-xs italic bg-slate-950/30 p-2 rounded leading-relaxed">
                                {commentary}
                            </p>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
