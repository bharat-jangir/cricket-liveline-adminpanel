import { Card, CardContent } from "../../ui/card";

interface InningsSummaryCardProps {
    teamName: string;
    totalRuns: number;
    totalWickets: number;
    totalOvers: string;
    commentary: string;
    onCommentaryChange?: (commentary: string) => void;
}

export function InningsSummaryCard({
    teamName,
    totalRuns,
    totalWickets,
    totalOvers,
    commentary,
    onCommentaryChange,
}: InningsSummaryCardProps) {
    return (
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-transparent">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{teamName}</h3>
                        <p className="text-white/90 text-lg">
                            Scored {totalRuns}/{totalWickets} in {totalOvers} overs
                        </p>

                        {/* Commentary */}
                        {onCommentaryChange ? (
                            <textarea
                                className="w-full mt-4 p-2 bg-white/10 text-white rounded border border-white/30 focus:outline-none focus:border-white/60 placeholder-white/50"
                                value={commentary}
                                onChange={(e) => onCommentaryChange(e.target.value)}
                                placeholder="Add commentary..."
                                rows={2}
                            />
                        ) : (
                            commentary && (
                                <p className="mt-4 text-white/90 text-sm italic">{commentary}</p>
                            )
                        )}
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center justify-center w-32 h-32 rounded-lg bg-white/20 border-2 border-white/40">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-white">{totalRuns}</div>
                            <div className="text-sm text-white/80">
                                {totalWickets} wickets
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
