import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const CATEGORIES = ["pattern", "verbal", "numerical", "spatial", "logic"] as const;

/**
 * Start a new timed IQ test.
 */
export const startTest = mutation({
    args: {
        totalQuestions: v.optional(v.number()),
        timeLimitMinutes: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const totalQuestions = args.totalQuestions ?? 30;
        const timeLimitMs = (args.timeLimitMinutes ?? 30) * 60 * 1000;

        return await ctx.db.insert("iqTests", {
            userId: identity.subject,
            status: "in_progress",
            totalQuestions,
            questionsAnswered: 0,
            startedAt: Date.now(),
            timeLimitMs,
        });
    }
});

/**
 * Increment questions answered count.
 */
export const incrementAnswered = mutation({
    args: { testId: v.id("iqTests") },
    handler: async (ctx, args) => {
        const test = await ctx.db.get(args.testId);
        if (!test) throw new Error("Test not found");
        await ctx.db.patch(args.testId, { questionsAnswered: test.questionsAnswered + 1 });
    }
});

/**
 * Submit a completed test and calculate IQ score.
 */
export const submitTest = mutation({
    args: { testId: v.id("iqTests") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const test = await ctx.db.get(args.testId);
        if (!test) throw new Error("Test not found");
        if (test.status !== "in_progress") throw new Error("Test already completed");

        const now = Date.now();
        await ctx.db.patch(args.testId, { status: "completed", completedAt: now });

        // Get all answers for this test
        const answers = await ctx.db
            .query("answers")
            .withIndex("by_test", q => q.eq("testId", args.testId))
            .collect();

        const totalCorrect = answers.filter(a => a.isCorrect).length;
        const totalTimeMs = now - test.startedAt;

        // Calculate category scores
        const catScores: Record<string, { correct: number; total: number }> = {};
        for (const category of CATEGORIES) {
            catScores[category] = { correct: 0, total: 0 };
        }

        for (const answer of answers) {
            const question = await ctx.db.get(answer.questionId);
            if (!question) continue;
            catScores[question.category].total++;
            if (answer.isCorrect) catScores[question.category].correct++;
        }

        // IQ scoring: map raw % to IQ scale (mean=100, sd=15)
        const rawPercent = test.totalQuestions > 0 ? totalCorrect / test.totalQuestions : 0;
        // Simple z-score approximation (inverse normal CDF approximation)
        const z = (rawPercent - 0.5) * 4; // rough mapping
        const iqScore = Math.round(100 + z * 15);
        const clampedIq = Math.max(55, Math.min(145, iqScore));

        // Percentile from IQ
        const percentile = Math.round(
            100 * (0.5 * (1 + erf((clampedIq - 100) / (15 * Math.sqrt(2)))))
        );

        const categoryScores: Record<string, number> = {};
        for (const [cat, s] of Object.entries(catScores)) {
            categoryScores[cat] = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
        }

        await ctx.db.insert("testResults", {
            userId: identity.subject,
            testId: args.testId,
            iqScore: clampedIq,
            percentile,
            categoryScores: JSON.stringify(categoryScores),
            totalCorrect,
            totalQuestions: test.totalQuestions,
            totalTimeMs,
            createdAt: now,
        });

        return { iqScore: clampedIq, percentile, categoryScores, totalCorrect };
    }
});

/**
 * Get user's test history.
 */
export const getHistory = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const results = await ctx.db
            .query("testResults")
            .withIndex("by_user", q => q.eq("userId", identity.subject))
            .order("desc")
            .take(20);

        return results;
    }
});

/**
 * Get the user's current in-progress test, if any.
 */
export const getActiveTest = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const tests = await ctx.db
            .query("iqTests")
            .withIndex("by_user", q => q.eq("userId", identity.subject))
            .order("desc")
            .take(5);

        return tests.find(t => t.status === "in_progress") ?? null;
    }
});

/**
 * Get leaderboard — top IQ scores.
 */
export const getLeaderboard = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const results = await ctx.db
            .query("testResults")
            .order("desc")
            .take(100);

        // Deduplicate by user (keep highest score)
        const bestByUser: Record<string, typeof results[0]> = {};
        for (const r of results) {
            if (!bestByUser[r.userId] || r.iqScore > bestByUser[r.userId].iqScore) {
                bestByUser[r.userId] = r;
            }
        }

        return Object.values(bestByUser)
            .sort((a, b) => b.iqScore - a.iqScore)
            .slice(0, args.limit ?? 10);
    }
});

// Error function approximation for percentile calculation
function erf(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const t = 1.0 / (1.0 + p * Math.abs(x));
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}
