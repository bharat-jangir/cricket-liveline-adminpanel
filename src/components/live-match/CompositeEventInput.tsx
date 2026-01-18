import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

export interface CompositeEventInputProps {
    onEventSubmit: (eventString: string) => Promise<void>;
    disabled?: boolean;
    recentEvents?: string[];
}

const VALID_EVENTS = [
    // Regular runs
    '0', '1', '2', '3', '4', '6',
    // Wides
    'wd', 'wd1', 'wd2', 'wd3', 'wd4', 'wd5', 'wd6',
    // No-balls
    'nb', 'nb1', 'nb2', 'nb3', 'nb4', 'nb5', 'nb6',
    // Leg byes
    'lb1', 'lb2', 'lb3', 'lb4', 'lb5', 'lb6',
    // Byes
    'b1', 'b2', 'b3', 'b4', 'b5', 'b6',
    // Wickets
    'w', 'wdw', 'nbw',
    // Other
    'o', 'u',
];

export function CompositeEventInput({
    onEventSubmit,
    disabled = false,
    recentEvents = [],
}: CompositeEventInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Update suggestions based on input
        if (inputValue.trim()) {
            const filtered = VALID_EVENTS.filter((event) =>
                event.toLowerCase().startsWith(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [inputValue]);

    const handleSubmit = async (event: string) => {
        if (!event.trim()) return;

        try {
            await onEventSubmit(event.trim().toLowerCase());
            setInputValue('');
            setSuggestions([]);
            setShowSuggestions(false);
        } catch (error: any) {
            console.error('Error submitting event:', error);
            toast.error(error.message || 'Failed to submit event');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(inputValue);
        } else if (e.key === 'Escape') {
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSubmit(suggestion);
    };

    return (
        <div className="relative space-y-2">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter event (e.g., wd4, nb6, wdw)..."
                        disabled={disabled}
                        className="font-mono uppercase"
                        autoComplete="off"
                    />

                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 font-mono uppercase"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent events */}
            {recentEvents.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Recent:</span>
                    {recentEvents.slice(0, 10).map((event, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className="font-mono text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => handleSubmit(event)}
                        >
                            {event}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Help text */}
            <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>
                    Examples: <span className="font-mono">wd4</span> (wide+4), <span className="font-mono">nb6</span> (no-ball+6),{' '}
                    <span className="font-mono">wdw</span> (wide+wicket), <span className="font-mono">lb1</span> (leg bye)
                </p>
            </div>
        </div>
    );
}
