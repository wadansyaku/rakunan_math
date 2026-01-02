"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

interface TimerProps {
    onApply: (minutes: string) => void;
}

export function Timer({ onApply }: TimerProps) {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    const handleStop = () => {
        setIsRunning(false);
        const mins = (seconds / 60).toFixed(1);
        onApply(mins);
    };

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
            <div className="font-mono text-2xl font-bold w-20 text-center">
                {formatTime(seconds)}
            </div>
            <Button
                type="button"
                size="default"
                variant="ghost"
                className="min-h-[44px] min-w-[44px]"
                onClick={() => setIsRunning(!isRunning)}
            >
                {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
                type="button"
                size="default"
                variant="ghost"
                className="min-h-[44px] min-w-[44px]"
                onClick={handleStop}
                disabled={seconds === 0}
            >
                <Square className="h-5 w-5 fill-current" />
            </Button>
            <Button
                type="button"
                size="default"
                variant="ghost"
                className="min-h-[44px] min-w-[44px]"
                onClick={() => { setIsRunning(false); setSeconds(0); }}
            >
                <RotateCcw className="h-5 w-5" />
            </Button>
        </div>
    );
}
