"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    ClipboardList,
    BookOpen,
    RefreshCw,
    Key,
    Upload,
    Search,
} from "lucide-react";

const navItems = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/quicklog", label: "QuickLog", icon: ClipboardList },
    { href: "/questions", label: "問題バンク", icon: BookOpen },
    { href: "/review", label: "復習リスト", icon: RefreshCw },
    { href: "/answer-key", label: "正答管理", icon: Key },
    { href: "/import", label: "インポート", icon: Upload, admin: true },
    { href: "/health-check", label: "整合性チェック", icon: Search, admin: true },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-14 items-center justify-between gap-3">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-base sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            洛南 算数 過去問
                        </span>
                    </Link>
                    <div className="flex items-center gap-1 overflow-x-auto py-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex shrink-0 items-center space-x-1 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                                        item.admin
                                            ? "opacity-60 hover:opacity-100 sm:flex hidden"
                                            : "",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden md:inline">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
