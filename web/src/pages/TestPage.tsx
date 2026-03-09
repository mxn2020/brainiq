import { useState, useEffect, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
type Id<T extends string> = string & { __tableName: T };
import { Clock, Brain, Loader2 } from "lucide-react";

const CATEGORIES = ["pattern", "verbal", "numerical", "spatial", "logic"] as const;
type Category = typeof CATEGORIES[number];

export default function TestPage() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<"intro" | "generating" | "testing" | "submitting">("intro");
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [testId, setTestId] = useState<Id<"iqTests"> | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min in seconds
    const [answerStart, setAnswerStart] = useState(Date.now());

    const generateQuestions = useAction(api.questions.generateQuestions);
    const startTest = useMutation(api.tests.startTest);
    const saveAnswer = useMutation(api.questions.saveAnswer);
    const incrementAnswered = useMutation(api.tests.incrementAnswered);
    const submitTest = useMutation(api.tests.submitTest);
    const questions = useQuery(api.questions.getByCategory, { category: "pattern", limit: 100 });

    const currentQuestionId = questionIds[currentIndex];
    const currentQuestion = questions?.find(q => q._id === currentQuestionId);

    // Timer
    useEffect(() => {
        if (phase !== "testing") return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    const handleStart = async () => {
        setPhase("generating");
        const id = await startTest({ totalQuestions: 30, timeLimitMinutes: 30 });
        setTestId(id);

        // Generate 6 per category = 30 questions
        const allIds: string[] = [];
        for (const cat of CATEGORIES) {
            try {
                const ids = await generateQuestions({ category: cat, difficulty: "medium", count: 6 });
                allIds.push(...ids);
            } catch { /* continue with other categories */ }
        }

        setQuestionIds(allIds);
        setPhase("testing");
        setAnswerStart(Date.now());
    };

    const handleAnswer = async (index: number) => {
        if (selectedAnswer !== null || !currentQuestionId || !testId) return;
        setSelectedAnswer(index);
        const timeSpent = Date.now() - answerStart;

        await saveAnswer({
            questionId: currentQuestionId as Id<"questions">,
            testId,
            selectedIndex: index,
            timeSpentMs: timeSpent,
        });
        await incrementAnswered({ testId });

        // Auto-advance after short delay
        setTimeout(() => {
            if (currentIndex < questionIds.length - 1) {
                setCurrentIndex(i => i + 1);
                setSelectedAnswer(null);
                setAnswerStart(Date.now());
            } else {
                handleSubmit();
            }
        }, 500);
    };

    const handleSubmit = useCallback(async () => {
        if (!testId || phase === "submitting") return;
        setPhase("submitting");
        const result = await submitTest({ testId });
        navigate(`/results?testId=${testId}&iq=${result.iqScore}&percentile=${result.percentile}`);
    }, [testId, phase]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    // Intro screen
    if (phase === "intro") {
        return (
            <div style={{ maxWidth: 600, margin: "0 auto", padding: "3rem 1rem", textAlign: "center" }}>
                <Brain size={56} style={{ color: "var(--color-accent)", marginBottom: 16 }} />
                <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}>IQ Assessment</h1>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
                    This test consists of <strong>30 questions</strong> across 5 categories:
                    pattern recognition, verbal reasoning, numerical, spatial, and logic.
                    You have <strong>30 minutes</strong> to complete it.
                </p>
                <button onClick={handleStart}
                    style={{
                        padding: "0.75rem 3rem", borderRadius: 12,
                        background: "var(--color-accent)", color: "white",
                        fontWeight: 700, fontSize: "1.1rem", border: "none", cursor: "pointer"
                    }}>
                    Begin Test
                </button>
            </div>
        );
    }

    // Generating
    if (phase === "generating") {
        return (
            <div style={{ maxWidth: 600, margin: "0 auto", padding: "3rem 1rem", textAlign: "center" }}>
                <Loader2 size={48} style={{ color: "var(--color-accent)", animation: "spin 1s linear infinite" }} />
                <h2 style={{ marginTop: 16 }}>Generating your test...</h2>
                <p style={{ color: "var(--color-text-secondary)" }}>AI is creating 30 unique questions across 5 categories.</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    // Submitting
    if (phase === "submitting") {
        return (
            <div style={{ maxWidth: 600, margin: "0 auto", padding: "3rem 1rem", textAlign: "center" }}>
                <Loader2 size={48} style={{ color: "var(--color-accent)", animation: "spin 1s linear infinite" }} />
                <h2 style={{ marginTop: 16 }}>Calculating your IQ score...</h2>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    // Testing
    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1rem" }}>
            {/* Header bar */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "1.5rem", padding: "0.75rem 1rem", borderRadius: 10,
                background: "var(--color-surface)", border: "1px solid var(--color-border)"
            }}>
                <span style={{ fontWeight: 600 }}>Question {currentIndex + 1} / {questionIds.length}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: timeLeft < 300 ? "#EF4444" : "var(--color-text-secondary)" }}>
                        <Clock size={16} /> {formatTime(timeLeft)}
                    </span>
                    <button onClick={handleSubmit}
                        style={{
                            padding: "0.4rem 1rem", borderRadius: 8,
                            background: "#EF4444", color: "white", fontWeight: 600,
                            border: "none", cursor: "pointer", fontSize: "0.85rem"
                        }}>
                        Submit Test
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: "1.5rem", background: "var(--color-border)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${((currentIndex + 1) / questionIds.length) * 100}%`, height: "100%", background: "var(--color-accent)", borderRadius: 6, transition: "width 0.3s" }} />
            </div>

            {/* Question */}
            {currentQuestion ? (
                <div style={{ padding: "1.5rem", borderRadius: 14, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "1.25rem", lineHeight: 1.5 }}>
                        {currentQuestion.questionText}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {currentQuestion.options.map((opt, i) => (
                            <button key={i} onClick={() => handleAnswer(i)}
                                disabled={selectedAnswer !== null}
                                style={{
                                    padding: "0.75rem 1rem", borderRadius: 10, textAlign: "left",
                                    background: selectedAnswer === i ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.05)",
                                    border: selectedAnswer === i ? "2px solid var(--color-accent)" : "1px solid rgba(139,92,246,0.15)",
                                    cursor: selectedAnswer !== null ? "default" : "pointer",
                                    fontSize: "0.95rem", color: "inherit"
                                }}>
                                <span style={{ fontWeight: 600, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span> {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>
                    Loading question...
                </div>
            )}
        </div>
    );
}
