import Link from "next/link";
import { ArrowRight, Building2, Factory, LayoutDashboard, LineChart, UserRound } from "lucide-react";
import type { Service } from "@/lib/services";

export const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "personal-website": UserRound,
  "corporate-website": Building2,
  "content-factory": Factory,
  "web-service-development": LayoutDashboard,
};

export function ServiceCard({ s }: { s: Service }) {
  const Icon = serviceIcons[s.slug] ?? LineChart;
  return (
    <Link href={`/services/${s.slug}/`} className="card group flex flex-col rounded-xl border p-6 hover:border-foreground/20 hover:bg-accent">
      <div className="flex items-center justify-between">
        <Icon className="card-icon size-5 text-muted-foreground" />
        <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>
      <p className="mt-4 font-semibold">{s.title}</p>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.short}</p>
      <p className="mt-5 text-sm font-medium">{s.prices[0].value}</p>
    </Link>
  );
}
