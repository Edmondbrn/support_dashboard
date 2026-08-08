import { LayoutDashboard } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <LayoutDashboard className="size-10 text-orange-300" />
            <p className="text-lg font-medium text-white">Welcome back</p>
            <p className="text-sm text-slate-400">Your support dashboard is coming soon</p>
        </div>
    );
}