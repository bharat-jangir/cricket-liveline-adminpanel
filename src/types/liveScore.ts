// Live score related types for cricket match scoring

export interface Batsman {
    playerId: string;
    playerName?: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate?: number;
    battingPosition?: number;
    isOut: boolean;
    isRetiredHurt?: boolean;
    isAbsent?: boolean;
    dismissalType?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'not_out' | 'retired_hurt' | 'absent';
    bowlerId?: string;
    fielderId?: string;
    fielder2Id?: string;
    dismissalText?: string;
    dots?: number;
    ones?: number;
    twos?: number;
    threes?: number;
    isOnStrike?: boolean;
    calculationMode?: 'auto' | 'manual';
    isVisible?: boolean;
    to?: string; // This Over - runs scored in current over
    tr?: string | number; // Total Runs
}

export interface Bowler {
    playerId: string;
    playerName?: string;
    overs: number;
    completedOvers?: number;
    balls: number;
    maidens: number;
    runs: number;
    wickets: number;
    noBalls: number;
    wides: number;
    economy?: number;
    bowlingOrder?: number;
    dots?: number;
    fours?: number;
    sixes?: number;
    calculationMode?: 'auto' | 'manual';
    isVisible?: boolean;
}

export interface Session {
    session: number;
    open: number;
    pass: number;
    min: number;
    max: number;
}
