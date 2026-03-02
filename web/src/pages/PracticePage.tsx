import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSearchParams } from "react-router-dom";
import { Brain, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

type Category = "pattern" | "verbal" | "numerical" | "spatial" | "logic";

const CATEGORIES: { id: Category; name: string }[] = [
    { id: "pattern", name: "Pattern Recognition" },
    { id: "verbal", name: "Verbal Reasoning" },
    { id: "numerical", name: "Numerical" },
    { id: "spatial", name: "Spatial" },
    { id: "logic", name: "Logic" },
];

export default function PracticePage() {
    const [searchParams] = useSearchParams();
    const initialCat = (searchParams.get("category") as Category) || "pattern";
    const [category, setCategory] = useState<Category>(initialCat);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [generating, setGenerating] = useState(false);
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctIndex: number; explanation: string } | null>(null);
    const [answerStart, setAnswerStart] = useState(Date.now());

    const generateQuestions = useAction(api.questions.generateQuestions);
    const saveAnswer = useMutation(api.questions.saveAnswer);
    const questions = useQuery(api.questions.getByCategory, { category, limit: 50 });

    const currentQuestionId = questionIds[currentIndex];
    const currentQuestion = questions?.find(q => q._id === currentQuestionId);

    const handleGenerate = async () => {
        setGenerating(true);
        setQuestionIds([]);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setFeedback(null);
        try {
            const ids = await generateQuestions({ category, difficulty, count: 5 });
            setQuestionIds(ids);
            setAnswerStart(Date.now());
        } catch (err) {
            console.error("Failed to generate questions:", err);
        }
        setGenerating(false);
    };

    const handleAnswer = async (index: number) => {
        if (selectedAnswer !== null || !currentQuestionId) return;
        setSelectedAnswer(index);
        const timeSpent = Date.now() - answerStart;
        const result = await saveAnswer({
            questionId: currentQuestionId as Id<"questions">,
            selectedIndex: index,
            timeSpentMs: timeSpent,
        });
        setFeedback(result);
    };

    const handleNext = () => {
        setSelectedAnswer(null);
        setFeedback(null);
        setCurrentIndex(i => i + 1);
        setAnswerStart(Date.now());
    };

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Brain size={28} style={{ color: "var(--color-accent)" }} /> Practice Mode
            </h1>

            {/* Controls */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <select value={category} onChange={e => setCategory(e.target.value as Category)}
                    style={{ padding: "0.5rem 1rem", borderRadius: 8, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "inherit" }}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                    style={{ padding: "0.5rem 1rem", borderRadius: 8, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "inherit" }}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <button onClick={handleGenerate} disabled={generating}
                    style={{
                        padding: "0.5rem 1.5rem", borderRadius: 8, fontWeight: 600,
                        background: "var(--color-accent)", color: "white", border: "none", cursor: generating ? "wait" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, opacity: generating ? 0.7 : 1
                    }}>
                    {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : "Generate Questions"}
                </button>
            </div>

            {/* Question Card */}
            {currentQuestion && (
                <div style={{
                    padding: "1.5rem", borderRadius: 14,
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    marginBottom: "1rem"
                }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: 12 }}>
                        Question {currentIndex + 1} of {questionIds.length} • {category} • {difficulty}
                    </div>
                    <p style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "1.25rem", lineHeight: 1.5 }}>
                        {currentQuestion.questionText}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {currentQuestion.options.map((opt, i) => {
                            let bg = "rgba(139,92,246,0.05)";
                            let border = "1px solid rgba(139,92,246,0.15)";
                            if (selectedAnswer !== null) {
                                if (i === currentQuestion.correctIndex) {
                                    bg = "rgba(16,185,129,0.15)";
                                    border = "1px solid rgba(16,185,129,0.4)";
                                } else if (i === selectedAnswer && !feedback?.isCorrect) {
                                    bg = "rgba(239,68,68,0.15)";
                                    border = "1px solid rgba(239,68,68,0.4)";
                                }
                            }
                            return (
                                <button key={i} onClick={() => handleAnswer(i)}
                                    disabled={selectedAnswer !== null}
                                    style={{
                                        padding: "0.75rem 1rem", borderRadius: 10, textAlign: "left",
                                        background: bg, border, cursor: selectedAnswer !== null ? "default" : "pointer",
                                        display: "flex", alignItems: "center", gap: 10, fontSize: "0.95rem", color: "inherit"
                                    }}>
                                    <span style={{ fontWeight: 600, minWidth: 24 }}>{String.fromCharCode(65 + i)}.</span>
                                    {opt}
                                    {selectedAnswer !== null && i === currentQuestion.correctIndex && <CheckCircle size={18} style={{ color: "#10B981", marginLeft: "auto" }} />}
                                    {selectedAnswer === i && !feedback?.isCorrect && <XCircle size={18} style={{ color: "#EF4444", marginLeft: "auto" }} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div style={{
                            marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 10,
                            background: feedback.isCorrect ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            border: `1px solid ${feedback.isCorrect ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`
                        }}>
                            <strong>{feedback.isCorrect ? "✅ Correct!" : "❌ Incorrect"}</strong>
                            <p style={{ marginTop: 4, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>{feedback.explanation}</p>
                        </div>
                    )}

                    {/* Next button */}
                    {selectedAnswer !== null && currentIndex < questionIds.length - 1 && (
                        <button onClick={handleNext}
                            style={{
                                marginTop: "1rem", padding: "0.5rem 1.5rem", borderRadius: 8,
                                background: "var(--color-accent)", color: "white", fontWeight: 600,
                                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                            }}>
                            Next <ArrowRight size={16} />
                        </button>
                    )}

                    {selectedAnswer !== null && currentIndex >= questionIds.length - 1 && (
                        <div style={{ marginTop: "1rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                            🎉 Practice session complete! Generate more questions to continue.
                        </div>
                    )}
                </div>
            )}

            {!currentQuestion && questionIds.length === 0 && !generating && (
                <div style={{
                    padding: "3rem", textAlign: "center", borderRadius: 14,
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)"
                }}>
                    Select a category and difficulty, then click <strong>Generate Questions</strong> to start practicing.
                </div>
            )}
        </div>
    );
}
