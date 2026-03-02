import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Brain, Target, Trophy, TrendingUp, Zap, BookOpen } from "lucide-react";

const CATEGORIES = [
    { id: "pattern" as const, name: "Pattern Recognition", icon: Target, color: "#8B5CF6" },
    { id: "verbal" as const, name: "Verbal Reasoning", icon: BookOpen, color: "#3B82F6" },
    { id: "numerical" as const, name: "Numerical", icon: TrendingUp, color: "#10B981" },
    { id: "spatial" as const, name: "Spatial", icon: Zap, color: "#F59E0B" },
    { id: "logic" as const, name: "Logic", icon: Brain, color: "#EF4444" },
];

export default function AppHome() {
    const stats = useQuery(api.questions.getUserStats);
    const history = useQuery(api.tests.getHistory);
    const latestResult = history?.[0];

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
            {/* Hero */}
            <div style={{
                textAlign: "center", marginBottom: "2.5rem",
                background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.08))",
                borderRadius: 16, padding: "2.5rem 1.5rem", border: "1px solid rgba(139,92,246,0.2)"
            }}>
                <Brain size={48} style={{ color: "var(--color-accent)", marginBottom: 12 }} />
                <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>BrainIQ</h1>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem" }}>
                    Train your mind. Track your progress. Boost your IQ.
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
                    <Link to="/test" style={{
                        padding: "0.75rem 2rem", borderRadius: 10,
                        background: "var(--color-accent)", color: "white",
                        fontWeight: 600, textDecoration: "none", fontSize: "1rem"
                    }}>
                        🧪 Take IQ Test
                    </Link>
                    <Link to="/practice" style={{
                        padding: "0.75rem 2rem", borderRadius: 10,
                        background: "rgba(139,92,246,0.1)", color: "var(--color-accent)",
                        fontWeight: 600, textDecoration: "none", border: "1px solid rgba(139,92,246,0.3)"
                    }}>
                        📝 Practice
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <StatCard icon={<Target size={22} />} label="Questions Answered" value={stats?.total ?? 0} color="#8B5CF6" />
                <StatCard icon={<TrendingUp size={22} />} label="Accuracy" value={`${stats?.accuracy ?? 0}%`} color="#10B981" />
                <StatCard icon={<Trophy size={22} />} label="Latest IQ" value={latestResult?.iqScore ?? "—"} color="#F59E0B" />
                <StatCard icon={<Brain size={22} />} label="Tests Taken" value={history?.length ?? 0} color="#3B82F6" />
            </div>

            {/* Category Grid */}
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "1rem" }}>Practice by Category</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const catStat = stats?.byCategory?.[cat.id];
                    return (
                        <Link key={cat.id} to={`/practice?category=${cat.id}`}
                            style={{
                                padding: "1.25rem", borderRadius: 12,
                                background: `${cat.color}10`, border: `1px solid ${cat.color}30`,
                                textDecoration: "none", color: "inherit", display: "flex",
                                flexDirection: "column", gap: 8, transition: "transform 0.2s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                        >
                            <Icon size={24} style={{ color: cat.color }} />
                            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{cat.name}</span>
                            {catStat && (
                                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                                    {catStat.correct}/{catStat.total} correct
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Recent Results */}
            {history && history.length > 0 && (
                <>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "1rem" }}>Recent Tests</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {history.slice(0, 5).map(r => (
                            <div key={r._id} style={{
                                padding: "1rem 1.25rem", borderRadius: 12,
                                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                                display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}>
                                <div>
                                    <span style={{ fontWeight: 600 }}>IQ: {r.iqScore}</span>
                                    <span style={{ color: "var(--color-text-secondary)", marginLeft: 12, fontSize: "0.9rem" }}>
                                        {r.totalCorrect}/{r.totalQuestions} correct
                                    </span>
                                </div>
                                <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                        <Link to="/history" style={{ color: "var(--color-accent)", textAlign: "center", fontSize: "0.9rem" }}>
                            View all results →
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div style={{
            padding: "1.25rem", borderRadius: 12,
            background: `${color}08`, border: `1px solid ${color}20`,
            textAlign: "center"
        }}>
            <div style={{ color, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{label}</div>
        </div>
    );
}
