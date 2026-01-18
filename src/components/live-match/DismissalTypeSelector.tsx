import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

export interface Player {
    _id: string;
    name: string;
}

export interface DismissalTypeSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (dismissalType: string, dismissalText: string) => void;
    players: Player[]; // Bowling squad (fielders/bowlers)
    currentBowler?: Player;
    wicketContext?: {
        eventType: string;
        runs: number;
        extras: number;
    };
}

const DISMISSAL_TYPES = [
    { value: 'bowled', label: 'Bowled', common: true, requiresFielder: false, requiresBowler: true },
    { value: 'caught', label: 'Caught', common: true, requiresFielder: true, requiresBowler: true },
    { value: 'lbw', label: 'LBW', common: true, requiresFielder: false, requiresBowler: true },
    { value: 'run_out', label: 'Run Out', common: true, requiresFielder: true, requiresBowler: false }, // Bowler optional? Usually implies fielder
    { value: 'stumped', label: 'Stumped', common: true, requiresFielder: true, requiresBowler: true },
    { value: 'hit_wicket', label: 'Hit Wicket', common: false, requiresFielder: false, requiresBowler: true },
    { value: 'obstructing_field', label: 'Obstructing the Field', common: false, requiresFielder: false, requiresBowler: false },
    { value: 'handled_ball', label: 'Handled the Ball', common: false, requiresFielder: false, requiresBowler: false },
    { value: 'hit_ball_twice', label: 'Hit Ball Twice', common: false, requiresFielder: false, requiresBowler: false },
    { value: 'timed_out', label: 'Timed Out', common: false, requiresFielder: false, requiresBowler: false },
];

export function DismissalTypeSelector({
    open,
    onClose,
    onSelect,
    players = [],
    currentBowler,
    wicketContext,
}: DismissalTypeSelectorProps) {
    const [selectedType, setSelectedType] = React.useState<string>('caught');
    const [selectedBowlerId, setSelectedBowlerId] = React.useState<string>('');
    const [selectedFielderId, setSelectedFielderId] = React.useState<string>('');
    const [dismissalText, setDismissalText] = React.useState<string>('');

    // Pre-select current bowler when opening
    React.useEffect(() => {
        if (open && currentBowler) {
            setSelectedBowlerId(currentBowler._id);
        }
    }, [open, currentBowler]);

    // Auto-generate text when selections change
    React.useEffect(() => {
        const typeConfig = DISMISSAL_TYPES.find(d => d.value === selectedType);
        if (!typeConfig) return;

        let text = '';
        const bowlerName = players.find(p => p._id === selectedBowlerId)?.name || 'Unknown';
        const fielderName = players.find(p => p._id === selectedFielderId)?.name || 'Unknown';

        switch (selectedType) {
            case 'bowled':
                text = `b ${bowlerName}`;
                break;
            case 'caught':
                text = `c ${fielderName} b ${bowlerName}`;
                break;
            case 'lbw':
                text = `lbw b ${bowlerName}`;
                break;
            case 'run_out':
                text = `run out (${fielderName})`;
                break;
            case 'stumped':
                text = `st ${fielderName} b ${bowlerName}`;
                break;
            case 'hit_wicket':
                text = `hit wicket b ${bowlerName}`;
                break;
            default:
                text = typeConfig.label.toLowerCase(); // Default fallback
        }
        setDismissalText(text);
    }, [selectedType, selectedBowlerId, selectedFielderId, players]);

    const handleConfirm = () => {
        onSelect(selectedType, dismissalText);
        // Don't close immediately - let the parent handle success/failure closure
        // onClose(); 
    };

    const currentTypeConfig = DISMISSAL_TYPES.find(d => d.value === selectedType);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Dismissal Details</DialogTitle>
                    <DialogDescription>
                        Select the type and players involved to generate the dismissal record.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-2">
                        {DISMISSAL_TYPES.map((type) => (
                            <Button
                                key={type.value}
                                variant={selectedType === type.value ? "default" : "outline"}
                                className={`justify-start text-xs ${selectedType === type.value ? 'bg-blue-600 text-white' : ''}`}
                                onClick={() => setSelectedType(type.value)}
                                size="sm"
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>

                    <div className="space-y-3 border-t pt-4 mt-2">
                        {/* Bowler Selection */}
                        {currentTypeConfig?.requiresBowler && (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Bowler</label>
                                <select
                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={selectedBowlerId}
                                    onChange={(e) => setSelectedBowlerId(e.target.value)}
                                >
                                    <option value="">Select Bowler</option>
                                    {players.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Fielder Selection */}
                        {currentTypeConfig?.requiresFielder && (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Fielder</label>
                                <select
                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={selectedFielderId}
                                    onChange={(e) => setSelectedFielderId(e.target.value)}
                                >
                                    <option value="">Select Fielder</option>
                                    {players.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Dismissal Text Input */}
                        <div className="flex flex-col gap-1 bg-slate-100 p-2 rounded">
                            <label className="text-xs font-bold text-slate-500">Dismissal Text (Editable)</label>
                            <input
                                className="text-sm font-medium font-mono text-slate-900 bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-500 w-full"
                                value={dismissalText}
                                onChange={(e) => setDismissalText(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>Update Dismissal</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
