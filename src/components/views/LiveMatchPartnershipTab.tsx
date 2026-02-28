import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Partnership {
  id: number;
  batsman: string;
  nbKey: string;
  obKey: string;
  nbName: string;
  obName: string;
  nbRun: string;
  obRun: string;
  nbBall: string;
  obBall: string;
  score: string;
  wicket: string;
}

interface Inning {
  _id?: string;
  inningNumber: number;
  type?: 'regular' | 'super_over';
  superOverNumber?: number;
}

interface LiveMatchPartnershipTabProps {
  partnerships: Partnership[];
  selectedInning: number;
  onInningChange: (inning: number) => void;
  innings: Inning[];
  onSave: () => void;
  onAddRow: (afterId?: number) => void;
  onDeleteRow: (id: number) => void;
  onFieldChange: (id: number, field: string, value: string) => void;
}

export function LiveMatchPartnershipTab({
  partnerships,
  selectedInning,
  onInningChange,
  innings,
  onSave,
  onAddRow,
  onDeleteRow,
  onFieldChange,
}: LiveMatchPartnershipTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Live Partnership
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Inning
            </span>
            <Select
              value={selectedInning.toString()}
              onValueChange={(val) => onInningChange(parseInt(val))}
            >
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {innings.length > 0 ? (
                  innings.map((inning) => (
                    <SelectItem key={inning.inningNumber} value={inning.inningNumber.toString()}>
                      {inning.type === 'super_over'
                        ? `SO ${inning.superOverNumber || (inning.inningNumber > 2 ? Math.ceil((inning.inningNumber - 2) / 2) : 1)} (${inning.inningNumber})`
                        : `Inn ${inning.inningNumber}`}
                    </SelectItem>
                  ))
                ) : (
                  [1, 2, 3, 4].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      Inn {num}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => onAddRow()}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Row
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onSave}
          >
            Save Partnerships
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8">
            Preview Partnership
          </Button>
        </div>
      </div>

      {/* Partnership Table */}
      <div className="flex-1 overflow-auto">
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Batsman
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NB Key
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  OB key
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NB Name
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  OB Name
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nb Run
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  OB Run
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NB Ball
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  OB Ball
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Score
                </th>
                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Wicket
                </th>
              </tr>
            </thead>
            <tbody>
              {partnerships.map((partnership) => (
                <tr
                  key={partnership.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddRow(partnership.id)}
                        className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        value={partnership.batsman}
                        onChange={(e) =>
                          onFieldChange(
                            partnership.id,
                            "batsman",
                            e.target.value
                          )
                        }
                        className="h-8 text-sm bg-white dark:bg-slate-700"
                        placeholder=""
                      />
                    </div>
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onDeleteRow(partnership.id)
                        }
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        value={partnership.nbKey}
                        onChange={(e) =>
                          onFieldChange(
                            partnership.id,
                            "nbKey",
                            e.target.value
                          )
                        }
                        className="h-8 text-sm bg-white dark:bg-slate-700"
                        placeholder=""
                      />
                    </div>
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.obKey}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "obKey",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.nbName}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "nbName",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.obName}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "obName",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.nbRun}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "nbRun",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.obRun}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "obRun",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.nbBall}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "nbBall",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.obBall}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "obBall",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.score}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "score",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Input
                      value={partnership.wicket}
                      onChange={(e) =>
                        onFieldChange(
                          partnership.id,
                          "wicket",
                          e.target.value
                        )
                      }
                      className="h-8 text-sm bg-white dark:bg-slate-700"
                      placeholder=""
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

