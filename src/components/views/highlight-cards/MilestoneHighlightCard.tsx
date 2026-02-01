import { Card, CardContent } from "../../ui/card";

interface MilestoneHighlightCardProps {
    playerName: string;
    milestoneType: string; // '50', '100', '150', '200', '5-wicket', 'hat-trick'
    value: number;
    balls: number;
    commentary: string;
    onCommentaryChange?: (commentary: string) => void;
}

export function MilestoneHighlightCard({
    playerName,
    milestoneType,
    value,
    balls,
    commentary,
    onCommentaryChange,
}: MilestoneHighlightCardProps) {
    const getMilestoneColor = () => {
        if (milestoneType === "hat-trick") return "from-purple-600 to-pink-600";
        if (milestoneType.includes("wicket")) return "from-blue-600 to-purple-600";
        if (parseInt(milestoneType) >= 100) return "from-yellow-500 to-orange-600";
        return "from-purple-500 to-orange-500";
    };

    const getMilestoneText = () => {
        if (milestoneType === "hat-trick") return "HAT-TRICK!";
        if (milestoneType.includes("wicket")) return milestoneType.toUpperCase();
        return `${milestoneType}`;
    };

    return (
        <Card
            className={`bg-gradient-to-r ${getMilestoneColor()} border-transparent`}
        >
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    {/* Player Image Placeholder */}
                    <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-white">
                            {playerName.charAt(0)}
                        </span>
                    </div>

                    {/* Milestone Details */}
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{playerName}</h3>
                        <p className="text-white/90 text-sm mb-2">
                            Scored {value} in {balls} Balls
                        </p>

                        {/* Commentary */}
                        {onCommentaryChange ? (
                            <textarea
                                className="w-full mt-3 p-2 bg-white/10 text-white rounded border border-white/30 focus:outline-none focus:border-white/60 placeholder-white/50"
                                value={commentary}
                                onChange={(e) => onCommentaryChange(e.target.value)}
                                placeholder="Add commentary..."
                                rows={2}
                            />
                        ) : (
                            commentary && (
                                <p className="mt-3 text-white/90 text-sm italic">
                                    {commentary}
                                </p>
                            )
                        )}
                    </div>

                    {/* Milestone Badge */}
                    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-white/20 border-4 border-white/40">
                        <span className="text-4xl font-bold text-white">
                            {getMilestoneText()}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
