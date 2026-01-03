import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

interface LiveMatchPartnershipTabProps {
  partnerships: Partnership[];
  onPartnershipsChange: (partnerships: Partnership[]) => void;
}

export function LiveMatchPartnershipTab({
  partnerships,
  onPartnershipsChange,
}: LiveMatchPartnershipTabProps) {
  const [selectedInning, setSelectedInning] = useState("1");

  const handleAddPartnershipRow = (afterId?: number) => {
    const newRow: Partnership = {
      id: Math.max(...partnerships.map((p) => p.id), 0) + 1,
      batsman: "",
      nbKey: "",
      obKey: "",
      nbName: "",
      obName: "",
      nbRun: "",
      obRun: "",
      nbBall: "",
      obBall: "",
      score: "",
      wicket: "",
    };

    if (afterId) {
      const afterIndex = partnerships.findIndex((p) => p.id === afterId);
      const newPartnerships = [...partnerships];
      newPartnerships.splice(afterIndex + 1, 0, newRow);
      onPartnershipsChange(newPartnerships);
    } else {
      onPartnershipsChange([...partnerships, newRow]);
    }
  };

  const handleDeletePartnershipRow = (id: number) => {
    onPartnershipsChange(partnerships.filter((p) => p.id !== id));
  };

  const handlePartnershipChange = (
    id: number,
    field: string,
    value: string
  ) => {
    onPartnershipsChange(
      partnerships.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

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
            <Select value={selectedInning} onValueChange={setSelectedInning}>
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
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
                        onClick={() => handleAddPartnershipRow(partnership.id)}
                        className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        value={partnership.batsman}
                        onChange={(e) =>
                          handlePartnershipChange(
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
                          handleDeletePartnershipRow(partnership.id)
                        }
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        value={partnership.nbKey}
                        onChange={(e) =>
                          handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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
                        handlePartnershipChange(
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

