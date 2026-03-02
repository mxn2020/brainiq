import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy, Brain, ArrowRight, BarChart3 } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
    pattern: "Pattern Recognition",
    verbal: "Verbal Reasoning",
    numerical: "Numerical",
    spatial: "Spatial",
    logic: "Logic",
};

const CATEGORY_COLORS: Record<string, string> = {
    pattern: "#8B5CF6",
    verbal: "#3B82F6",
    numerical: "#10B981",
    spatial: "#F59E0B",
    logic: "#EF4444",
};

export default function ResultsPage() {
    const [searchParams] = useSearchParams();
    const iq = parseInt(searchParams.get("iq") ?? "100");
    const percentile = parseInt(searchParams.get("percentile") ?? "50");
    const history = useQuery(api.tests.getHistory);
    const latest = history?.[0];

    const categoryScores: Record<string, number> = latest
        ? JSON.parse(latest.categoryScores)
        : {};

    const getIQLabel = (score: number) => {
        if (score >= 130) return "Very Superior";
        if (score >= 120) return "Superior";
        if (score >= 110) return "High Average";
        if (score >= 90) return "Average";
        if (score >= 80) return "Low Average";
        return "Below Average";
    };

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
            {/* Score Hero */}
            <div style={{
                textAlign: "center", marginBottom: "2rem", padding: "2.5rem",
                borderRadius: 20, background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))",
                border: "1px solid rgba(139,92,246,0.3)"
            }}>
                <Trophy size={40} style={{ color: "#F59E0B", marginBottom: 8 }} />
                <h1 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Your IQ Score</h1>
                <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--color-accent)", lineHeight: 1 }}>{iq}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: 8, color: "var(--color-text-secondary)" }}>{getIQLabel(iq)}</div>
                <div style={{ marginTop: 12, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                    Top <strong>{100 - percentile}%</strong> • Percentile: {percentile}
                </div>
                {latest && (
                    <div style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                        {latest.totalCorrect}/{latest.totalQuestions} correct •
                        {Math.round(latest.totalTimeMs / 1000 / 60)} min
                    </div>
                )}
            </div>

            {/* Category Breakdown */}
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart3 size={20} /> Category Breakdown
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                {Object.entries(categoryScores).map(([cat, score]) => (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ minWidth: 140, fontSize: "0.9rem", fontWeight: 500 }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                        <div style={{ flex: 1, background: "var(--color-border)", borderRadius: 6, height: 12, overflow: "hidden" }}>
                            <div style={{
                                width: `${score}%`, height: "100%",
                                background: CATEGORY_COLORS[cat] ?? "#8B5CF6",
                                borderRadius: 6, transition: "width 1s ease-out"
                            }} />
                        </div>
                        <span style={{ minWidth: 40, textAlign: "right", fontWeight: 600, fontSize: "0.9rem" }}>{score}%</span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/test" style={{
                    padding: "0.75rem 2rem", borderRadius: 10,
                    background: "var(--color-accent)", color: "white",
                    fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6
                }}>
                    <Brain size={18} /> Retake Test
                </Link>
                <Link to="/practice" style={{
                    padding: "0.75rem 2rem", borderRadius: 10,
                    background: "rgba(139,92,246,0.1)", color: "var(--color-accent)",
                    fontWeight: 600, textDecoration: "none", border: "1px solid rgba(139,92,246,0.3)",
                    display: "flex", alignItems: "center", gap: 6
                }}>
                    Practice More <ArrowRight size={16} />
                </Link>
                <Link to="/history" style={{
                    padding: "0.75rem 2rem", borderRadius: 10,
                    background: "rgba(139,92,246,0.1)", color: "var(--color-accent)",
                    fontWeight: 600, textDecoration: "none", border: "1px solid rgba(139,92,246,0.3)"
                }}>
                    View History
                </Link>
            </div>
        </div>
    );
}
