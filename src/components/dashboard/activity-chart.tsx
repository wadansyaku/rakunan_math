"use client";

import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityChartProps {
    data: { date: string; count: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            setIsReady(el.offsetWidth > 0 && el.offsetHeight > 0);
        };

        update();

        if (typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>学習アクティビティ</CardTitle>
                <CardDescription>
                    過去14日間の解答数
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div ref={containerRef} className="h-[200px] min-h-[200px]">
                    {isReady ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        const [, month, day] = String(value).split("-");
                                        return `${Number(month)}/${Number(day)}`;
                                    }}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Date
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {payload[0].payload.date}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Count
                                                            </span>
                                                            <span className="font-bold">
                                                                {payload[0].value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="currentColor"
                                    radius={[4, 4, 0, 0]}
                                    className="fill-primary"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
