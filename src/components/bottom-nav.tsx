"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    ClipboardList,
    BookOpen,
    RefreshCw,
    Settings,
} from "lucide-react";

const navItems = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/quicklog", label: "記録", icon: ClipboardList },
    { href: "/review", label: "復習", icon: RefreshCw },
    { href: "/questions", label: "問題", icon: BookOpen },
    { href: "/settings", label: "設定", icon: Settings },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] gap-1 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn(
                                "h-5 w-5",
                                isActive && "text-primary"
                            )} />
                            <span className={cn(
                                "text-[10px] font-medium",
                                isActive && "text-primary"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area for iPhone home indicator */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
