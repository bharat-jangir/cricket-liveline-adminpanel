import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Trash2, Save, Check } from "lucide-react";
import { RichTextEditor } from "../ui/RichTextEditor";
import { LiveMatchService } from "../../services/live-match.service";
import {
  WicketHighlightCard,
  MilestoneHighlightCard,
  InningsSummaryCard,
  OverSummaryCard,
} from "./highlight-cards";

/**
 * Helper to get ball style class based on ball outcome
 * Ported from LiveMatchLiveTab.tsx for consistency
 */
const getBallColorClass = (ball: any) => {
  // Default inactive color
  const defaultColor = 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100';

  // Extract label for simple matching
  const label = typeof ball === 'object'
    ? (ball.ballLabel || ball.label || String(ball.runs || ''))
    : String(ball);

  const cleanLabel = label.toLowerCase();

  // Wicket - Red
  if (cleanLabel === 'w' || (typeof ball === 'object' && (ball.type === 'WICKET' || ball.isWicket))) {
    return 'bg-red-600 text-white';
  }

  // Six - Green
  if (label === '6' || (typeof ball === 'object' && (ball.runs === 6 || ball.type === 'RUN' && ball.runs === 6))) {
    return 'bg-green-600 text-white';
  }

  // Four - Orange
  if (label === '4' || (typeof ball === 'object' && (ball.runs === 4 || ball.type === 'RUN' && ball.runs === 4))) {
    return 'bg-orange-500 text-white';
  }

  // Over end - Blue
  if (cleanLabel === 'o') {
    return 'bg-blue-600 text-white';
  }

  return defaultColor;
};

interface CommentaryEditorProps {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
}

function CommentaryEditor({ initialValue, onSave }: CommentaryEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(initialValue);
    setIsDirty(false);
  }, [initialValue]);

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await onSave(value);
      setIsDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save commentary:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <RichTextEditor
        value={value}
        onChange={(val) => {
          setValue(val);
          setIsDirty(val !== initialValue);
        }}
        placeholder="Enter commentary text..."
        className="min-h-[80px]"
      />
      {isDirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
          >
            {saving ? (
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
            ) : (
              <Save className="size-4 mr-1.5" />
            )}
            Save Changes
          </Button>
        </div>
      )}
      {!isDirty && saved && (
        <div className="flex justify-end text-emerald-600 text-xs font-medium items-center">
          <Check className="size-3 mr-1" />
          Changes Saved
        </div>
      )}
    </div>
  );
}

interface LiveMatchCommentaryTabProps {
  matchId: string;
}

export function LiveMatchCommentaryTab({
  matchId,
}: LiveMatchCommentaryTabProps) {
  const [commentary, setCommentary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch commentary from API
  useEffect(() => {
    const fetchCommentary = async () => {
      // Only show loading if we don't have commentary yet (initial load)
      // or if matchId changed (commentary would likely be for different match)
      if (commentary.length === 0) {
        setLoading(true);
      }

      try {
        const data = await LiveMatchService.getCommentary(matchId);
        setCommentary(data);
      } catch (error) {
        console.error("Error fetching commentary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommentary();
  }, [matchId, refreshKey]);

  // Process commentary to add calculated labels and sort
  const processedCommentary = useMemo(() => {
    if (!commentary || commentary.length === 0) return [];

    // 1. Sort by timestamp ascending for sequential processing
    const sorted = [...commentary].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const overCounters: Record<string, number> = {};

    const withLabels = sorted.map(item => {
      const type = item.type || 'ball';

      // Events that represent a delivery and should be numbered
      const isDelivery = ['ball', 'wicket', 'milestone'].includes(type);

      if (!isDelivery) {
        return item;
      }

      const overNumber = item.overNumber || 0;
      const inningId = item.inningId || 'default';
      const overKey = `${inningId}-${overNumber}`;

      if (overCounters[overKey] === undefined) overCounters[overKey] = 0;

      if (item.isLegal) {
        overCounters[overKey]++;
      }

      const ballIndex = overCounters[overKey];
      return {
        ...item,
        calculatedIndex: `${overNumber - 1}.${ballIndex}`,
        calculatedResult: item.ballLabel || (type === 'wicket' ? 'W' : '')
      };
    });

    // 2. Reverse for display (latest first)
    return withLabels.reverse();
  }, [commentary]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateCommentary = async (
    commentaryId: string,
    newCommentary: string
  ) => {
    try {
      await LiveMatchService.updateCommentary(matchId, commentaryId, newCommentary);
      // Update local state
      setCommentary((prev) =>
        prev.map((item) =>
          item._id === commentaryId
            ? { ...item, commentary: newCommentary, isAutoGenerated: false }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating commentary:", error);
    }
  };

  const handleDeleteCommentary = async (commentaryId: string) => {
    try {
      await LiveMatchService.deleteCommentary(matchId, commentaryId);
      // Remove from local state
      setCommentary((prev) => prev.filter((item) => item._id !== commentaryId));
    } catch (error) {
      console.error("Error deleting commentary:", error);
    }
  };

  const renderCommentaryCard = (item: any) => {
    const commentaryType = item.type || "ball";

    // Render (Wicket, Milestone, etc.)
    const renderCardHeader = (index: string | undefined, label: string, id: string) => (
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {index && (
            <span className="text-slate-500 font-medium text-xs">
              {index}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBallColorClass(item)}`}>
            {label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
          onClick={() => handleDeleteCommentary(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );

    // Render wicket highlight card
    if (commentaryType === "wicket" && item.highlightData) {
      return (
        <div key={item._id} className="relative space-y-3">
          {renderCardHeader(item.calculatedIndex, item.calculatedResult || 'WICKET', item._id)}
          <WicketHighlightCard
            batsmanName={item.highlightData.wicketBatsmanName || "Batsman"}
            dismissalType={item.highlightData.wicketDismissalType || "bowled"}
            bowlerName={item.highlightData.wicketBowlerName || "Bowler"}
            fielderName={item.highlightData.wicketFielderName}
            runs={item.highlightData.wicketBatsmanRuns || 0}
            balls={item.highlightData.wicketBatsmanBalls || 0}
            fours={item.highlightData.wicketBatsmanFours || 0}
            sixes={item.highlightData.wicketBatsmanSixes || 0}
            strikeRate={item.highlightData.wicketBatsmanSR || 0}
            commentary={""} // Passed to editor instead
          />
          <CommentaryEditor
            initialValue={item.commentary || ""}
            onSave={(newVal) => handleUpdateCommentary(item._id, newVal)}
          />
        </div>
      );
    }

    // Render milestone highlight card
    if (commentaryType === "milestone" && item.highlightData) {
      return (
        <div key={item._id} className="relative space-y-3">
          {renderCardHeader(item.calculatedIndex, item.calculatedResult || 'MILESTONE', item._id)}
          <MilestoneHighlightCard
            playerName={item.highlightData.milestonePlayerName || "Player"}
            milestoneType={item.highlightData.milestoneType || "50"}
            value={item.highlightData.milestoneValue || 50}
            balls={item.highlightData.milestoneBalls || 0}
            commentary={""}
          />
          <CommentaryEditor
            initialValue={item.commentary || ""}
            onSave={(newVal) => handleUpdateCommentary(item._id, newVal)}
          />
        </div>
      );
    }

    // Render innings summary card
    if (commentaryType === "innings_summary" && item.highlightData) {
      return (
        <div key={item._id} className="relative space-y-3">
          {renderCardHeader(item.calculatedIndex, item.calculatedResult || 'INNINGS SUMMARY', item._id)}
          <InningsSummaryCard
            teamName={item.highlightData.inningsTeamName || "Team"}
            totalRuns={item.highlightData.inningsTotalRuns || 0}
            totalWickets={item.highlightData.inningsTotalWickets || 0}
            totalOvers={item.highlightData.inningsTotalOvers || "0.0"}
            commentary={""}
          />
          <CommentaryEditor
            initialValue={item.commentary || ""}
            onSave={(newVal) => handleUpdateCommentary(item._id, newVal)}
          />
        </div>
      );
    }

    // Render over summary card
    if (commentaryType === "over_end" && item.highlightData) {
      // Map ballsData objects to strings if needed
      const ballsLabels = (item.highlightData.overSummaryBallsData || []).map((b: any) =>
        typeof b === 'string' ? b : b.ballLabel || b.ballValue || '•'
      );

      return (
        <div key={item._id} className="relative space-y-3">
          {renderCardHeader(undefined, item.calculatedLabel || `OVER ${item.highlightData.overSummaryNumber || ''} SUMMARY`, item._id)}
          <OverSummaryCard
            overNumber={item.highlightData.overSummaryNumber || 1}
            bowlerName={item.highlightData.overSummaryBowlerName || "Bowler"}
            runs={item.highlightData.overSummaryRuns || 0}
            wickets={item.highlightData.overSummaryWickets || 0}
            ballsData={ballsLabels}
            commentary={""}
            matchScore={item.highlightData.matchScore}
            matchOvers={item.highlightData.matchOvers}
            batsman1={item.highlightData.batsman1}
            batsman2={item.highlightData.batsman2}
            bowler={item.highlightData.bowler}
          />
          <CommentaryEditor
            initialValue={item.commentary || ""}
            onSave={(newVal) => handleUpdateCommentary(item._id, newVal)}
          />
        </div>
      );
    }

    // Render regular ball commentary card
    return (
      <Card
        key={item._id}
        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      >
        <CardContent className="p-4 space-y-3">
          {/* Header with styled ball numbering */}
          {renderCardHeader(item.calculatedIndex, item.calculatedResult || 'Ball', item._id)}

          {/* Commentary Editor */}
          <CommentaryEditor
            initialValue={item.commentary || ""}
            onSave={(newVal) => handleUpdateCommentary(item._id, newVal)}
          />

          {/* Short text if available */}
          {item.shortText && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Short: {item.shortText}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-600 dark:text-slate-400">
          Loading commentary...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left Side: Commentary Cards */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {processedCommentary.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-600 dark:text-slate-400">
                <p className="text-lg font-semibold mb-2">No Commentary Yet</p>
                <p className="text-sm">
                  Commentary will appear here as balls are scored
                </p>
              </div>
            </div>
          ) : (
            processedCommentary.map((item: any) => renderCommentaryCard(item))
          )}
        </div>
      </div>

      {/* Right Side: Live Website Iframe - Tablet Border */}
      <div className="w-1/3 flex flex-col h-full">
        {/* Iframe Container */}
        <div className="flex-1 min-h-0 border-8 border-black dark:border-slate-800 rounded-lg overflow-hidden">
          <iframe
            src={`https://crex.com/scoreboard/TZA/1QR/2nd-T20/P/O/ind-vs-sa-2nd-t20-south-africa-tour-of-india-2025/live`}
            className="w-full h-full border-0"
            title="Live Match Website"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
