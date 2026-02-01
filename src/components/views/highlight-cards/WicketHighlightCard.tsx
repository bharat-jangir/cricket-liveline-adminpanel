import { Card, CardContent } from "../../ui/card";

interface WicketHighlightCardProps {
    batsmanName: string;
    dismissalType: string;
    bowlerName: string;
    fielderName?: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    commentary: string;
    onCommentaryChange?: (commentary: string) => void;
}

export function WicketHighlightCard({
    batsmanName,
    dismissalType,
    bowlerName,
    fielderName,
    runs,
    balls,
    fours,
    sixes,
    strikeRate,
    commentary,
    onCommentaryChange,
}: WicketHighlightCardProps) {
    const getDismissalText = () => {
        switch (dismissalType) {
            case "caught":
                return `c ${fielderName || "fielder"} b ${bowlerName}`;
            case "bowled":
                return `b ${bowlerName}`;
            case "lbw":
                return `lbw b ${bowlerName}`;
            case "run_out":
                return `run out (${fielderName || "fielder"})`;
            case "stumped":
                return `st ${fielderName || "keeper"} b ${bowlerName}`;
            case "hit_wicket":
                return `hit wicket b ${bowlerName}`;
            default:
                return "out";
        }
    };

    return (
        <Card className="bg-gradient-to-r from-red-900 to-red-700 border-red-600">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    {/* Player Image Placeholder */}
                    <div className="w-20 h-20 rounded-full bg-red-800 border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-white">
                            {batsmanName.charAt(0)}
                        </span>
                    </div>

                    {/* Wicket Details */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-white">{batsmanName}</h3>
                            <div className="bg-red-950 px-3 py-1 rounded-md">
                                <span className="text-red-200 font-bold text-sm">OUT</span>
                            </div>
                        </div>

                        <p className="text-red-100 text-sm mb-3">{getDismissalText()}</p>

                        {/* Stats */}
                        <div className="grid grid-cols-5 gap-3 text-center">
                            <div>
                                <div className="text-xs text-red-300">RUNS</div>
                                <div className="text-lg font-bold text-white">{runs}</div>
                            </div>
                            <div>
                                <div className="text-xs text-red-300">BALLS</div>
                                <div className="text-lg font-bold text-white">{balls}</div>
                            </div>
                            <div>
                                <div className="text-xs text-red-300">4s</div>
                                <div className="text-lg font-bold text-white">{fours}</div>
                            </div>
                            <div>
                                <div className="text-xs text-red-300">6s</div>
                                <div className="text-lg font-bold text-white">{sixes}</div>
                            </div>
                            <div>
                                <div className="text-xs text-red-300">SR</div>
                                <div className="text-lg font-bold text-white">
                                    {strikeRate.toFixed(1)}
                                </div>
                            </div>
                        </div>

                        {/* Commentary */}
                        {onCommentaryChange ? (
                            <textarea
                                className="w-full mt-4 p-2 bg-red-950 text-white rounded border border-red-600 focus:outline-none focus:border-red-400"
                                value={commentary}
                                onChange={(e) => onCommentaryChange(e.target.value)}
                                placeholder="Add commentary..."
                                rows={2}
                            />
                        ) : (
                            commentary && (
                                <p className="mt-4 text-red-100 text-sm italic">{commentary}</p>
                            )
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
