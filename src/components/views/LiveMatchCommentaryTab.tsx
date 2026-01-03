import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Link as LinkIcon, User, Trash2, FileText, BarChart3, Bell, Search } from "lucide-react";
import { RichTextEditor } from "../ui/RichTextEditor";

interface CommentaryBall {
  id: number;
  over: string;
  score: string;
  bowler: string;
  batsman: string;
  ballResult: string;
  commentaryText: string;
  isVoiceCard: boolean;
  isLinked: boolean;
  checkbox1: boolean;
  checkbox2: boolean;
}

interface LiveMatchCommentaryTabProps {
  commentary: CommentaryBall[];
  onCommentaryChange: (commentary: CommentaryBall[]) => void;
}

export function LiveMatchCommentaryTab({
  commentary,
  onCommentaryChange,
}: LiveMatchCommentaryTabProps) {
  const handleAddNormalBall = (afterBallId?: number) => {
    let newOver = "45.1";
    let newScore = "213/8";

    if (afterBallId) {
      const afterBall = commentary.find((b) => b.id === afterBallId);
      if (afterBall) {
        const [overNum, ballNum] = afterBall.over.split(".").map(Number);
        const newBallNum = ballNum + 1;

        if (newBallNum <= 6) {
          newOver = `${overNum}.${newBallNum}`;
        } else {
          newOver = `${overNum + 1}.1`;
        }
        newScore = afterBall.score;
      }
    }

    const newBall: CommentaryBall = {
      id: Math.max(...commentary.map((b) => b.id), 0) + 1,
      over: newOver,
      score: newScore,
      bowler: "",
      batsman: "",
      ballResult: "",
      commentaryText: "",
      isVoiceCard: false,
      isLinked: false,
      checkbox1: false,
      checkbox2: false,
    };

    if (afterBallId) {
      const afterIndex = commentary.findIndex((b) => b.id === afterBallId);
      const newCommentary = [...commentary];
      newCommentary.splice(afterIndex + 1, 0, newBall);
      onCommentaryChange(newCommentary);
    } else {
      onCommentaryChange([newBall, ...commentary]);
    }
  };

  const sortedCommentary = [...commentary].sort((a, b) => {
    const [aOver, aBall] = a.over.split(".").map(Number);
    const [bOver, bBall] = b.over.split(".").map(Number);

    if (aOver !== bOver) {
      return bOver - aOver;
    }
    return bBall - aBall;
  });

  const handleDeleteBall = (ballId: number) => {
    onCommentaryChange(commentary.filter((ball) => ball.id !== ballId));
  };

  const updateBall = (ballId: number, updates: Partial<CommentaryBall>) => {
    onCommentaryChange(
      commentary.map((item) =>
        item.id === ballId ? { ...item, ...updates } : item
      )
    );
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Side: Commentary Cards */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {sortedCommentary.map((ball) => (
            <Card
              key={ball.id}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <CardContent className="p-4 space-y-3">
                {/* + Normal Ball Button */}
                <div className="pt-2 border-b border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleAddNormalBall(ball.id)}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    + Normal Ball
                  </button>
                </div>
                {/* First Row: Over/Score, Bowler to Batsman, and Icons */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={ball.isVoiceCard}
                      onCheckedChange={(checked) => {
                        updateBall(ball.id, { isVoiceCard: checked as boolean });
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ball.over} {ball.score}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {ball.bowler} to {ball.batsman}
                      </span>
                    </div>
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        updateBall(ball.id, { isLinked: !ball.isLinked });
                      }}
                    >
                      <LinkIcon
                        className={`h-4 w-4 ${
                          ball.isLinked
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                    </Button>
                    <Checkbox
                      checked={ball.checkbox1}
                      onCheckedChange={(checked) => {
                        updateBall(ball.id, { checkbox1: checked as boolean });
                      }}
                      className="h-4 w-4"
                    />
                    <Checkbox
                      checked={ball.checkbox2}
                      onCheckedChange={(checked) => {
                        updateBall(ball.id, { checkbox2: checked as boolean });
                      }}
                      className="h-4 w-4"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        // Handle player action
                      }}
                    >
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteBall(ball.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Second Row: Ball Result Circle and Rich Text Editor */}
                <div className="flex items-start gap-3">
                  {/* Ball Result Circle */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {ball.ballResult || "0"}
                      </span>
                    </div>
                  </div>

                  {/* Rich Text Editor */}
                  <div className="flex-1">
                    <RichTextEditor
                      value={ball.commentaryText}
                      onChange={(value) => {
                        updateBall(ball.id, { commentaryText: value });
                      }}
                      placeholder="Enter commentary text..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Side: Live Website Iframe - Tablet Border */}
      <div className="w-1/3 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <FileText className="h-4 w-4" />
              <span>Fantasy Bulletin</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span>Match Facts</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Bell className="h-4 w-4" />
              <span>Notification</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

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

