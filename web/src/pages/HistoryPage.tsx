import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Clock, TrendingUp, Brain } from "lucide-react";

export default function HistoryPage() {
    const history = useQuery(api.tests.getHistory);

    if (!history) {
        return <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>Loading...</div>;
    }

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={28} style={{ color: "var(--color-accent)" }} /> Test History
            </h1>

            {history.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "3rem", borderRadius: 14,
                    background: "var(--color-surface)", border: "1px solid var(--color-border)"
                }}>
                    <Brain size={40} style={{ color: "var(--color-text-secondary)", marginBottom: 12 }} />
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>No tests taken yet.</p>
                    <Link to="/test" style={{
                        padding: "0.5rem 1.5rem", borderRadius: 8,
                        background: "var(--color-accent)", color: "white",
                        fontWeight: 600, textDecoration: "none"
                    }}>
                        Take your first IQ test
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {history.map((result, i) => {
                        const catScores: Record<string, number> = JSON.parse(result.categoryScores);
                        const avgCat = Object.values(catScores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(catScores).length, 1);

                        return (
                            <div key={result._id} style={{
                                padding: "1.25rem", borderRadius: 14,
                                background: i === 0 ? "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))" : "var(--color-surface)",
                                border: i === 0 ? "1px solid rgba(139,92,246,0.3)" : "1px solid var(--color-border)",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{
                                            fontSize: "1.5rem", fontWeight: 800, color: "var(--color-accent)"
                                        }}>
                                            IQ {result.iqScore}
                                        </span>
                                        {i === 0 && <span style={{
                                            fontSize: "0.7rem", padding: "2px 8px", borderRadius: 6,
                                            background: "var(--color-accent)", color: "white", fontWeight: 600
                                        }}>LATEST</span>}
                                    </div>
                                    <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                                        {new Date(result.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)", flexWrap: "wrap" }}>
                                    <span>📊 {result.totalCorrect}/{result.totalQuestions} correct ({Math.round(result.totalCorrect / result.totalQuestions * 100)}%)</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <Clock size={14} /> {Math.round(result.totalTimeMs / 1000 / 60)} min
                                    </span>
                                    <span>📈 Percentile: {result.percentile}</span>
                                </div>

                                {/* Mini category bars */}
                                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                                    {Object.entries(catScores).map(([cat, score]) => (
                                        <div key={cat} style={{ flex: 1, background: "var(--color-border)", borderRadius: 4, height: 6, overflow: "hidden" }}
                                            title={`${cat}: ${score}%`}>
                                            <div style={{
                                                width: `${score}%`, height: "100%",
                                                background: "var(--color-accent)", borderRadius: 4
                                            }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
