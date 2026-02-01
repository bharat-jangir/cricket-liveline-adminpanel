import { Card, CardContent } from "../../ui/card";

interface OverSummaryCardProps {
    overNumber: number;
    bowlerName: string;
    runs: number;
    wickets: number;
    ballsData: string[];
    commentary: string;
    onCommentaryChange?: (commentary: string) => void;
}

export function OverSummaryCard({
    overNumber,
    bowlerName,
    runs,
    wickets,
    ballsData,
    commentary,
    onCommentaryChange,
}: OverSummaryCardProps) {
    return (
        <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">
                            OVER {overNumber}
                        </h3>
                        <div className="text-sm text-slate-300">
                            {runs} run{runs !== 1 ? "s" : ""}
                            {wickets > 0 && (
                                <span className="ml-2 text-red-400">
                                    {wickets} wicket{wickets !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bowler */}
                    <div className="text-sm text-slate-400">
                        <span className="font-semibold text-white">{bowlerName}</span>
                    </div>

                    {/* Balls Data */}
                    <div className="flex gap-2 flex-wrap">
                        {ballsData.map((ball, index) => {
                            const isWicket = ball.includes("W");
                            const isBoundary = ball.includes("4") || ball.includes("6");
                            const isDot = ball === "0" || ball === "•";

                            return (
                                <div
                                    key={index}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isWicket
                                            ? "bg-red-600 text-white"
                                            : isBoundary
                                                ? "bg-green-600 text-white"
                                                : isDot
                                                    ? "bg-slate-700 text-slate-400"
                                                    : "bg-slate-600 text-white"
                                        }`}
                                >
                                    {ball}
                                </div>
                            );
                        })}
                    </div>

                    {/* Commentary */}
                    {onCommentaryChange ? (
                        <textarea
                            className="w-full p-2 bg-slate-900 text-white rounded border border-slate-600 focus:outline-none focus:border-slate-400 placeholder-slate-500"
                            value={commentary}
                            onChange={(e) => onCommentaryChange(e.target.value)}
                            placeholder="Add commentary..."
                            rows={2}
                        />
                    ) : (
                        commentary && (
                            <p className="text-slate-300 text-sm italic">{commentary}</p>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
