import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Upload, Search, Settings } from "lucide-react";

const adminItems = [
    {
        href: "/answer-key",
        title: "正答管理",
        description: "正答や単位の確認・修正を行います。",
        icon: Key,
    },
    {
        href: "/import",
        title: "インポート",
        description: "問題・タグ・正答のデータを取り込みます。",
        icon: Upload,
    },
    {
        href: "/health-check",
        title: "整合性チェック",
        description: "データの不整合や未入力を確認します。",
        icon: Search,
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">設定</h1>
                    <p className="text-muted-foreground">
                        管理者向けの機能をまとめています（生徒は通常利用しません）。
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {adminItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.href} className="border-muted/60">
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        {item.title}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        管理者向け
                                    </Badge>
                                </div>
                                <CardDescription>{item.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={item.href}>開く</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
