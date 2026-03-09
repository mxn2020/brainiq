import { action, mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const CATEGORIES = ["pattern", "verbal", "numerical", "spatial", "logic"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_PROMPTS: Record<Category, string> = {
    pattern: "Generate a pattern recognition question. Show a sequence of shapes, numbers, or symbols and ask which comes next.",
    verbal: "Generate a verbal reasoning question. Test vocabulary, analogies, or reading comprehension.",
    numerical: "Generate a numerical reasoning question. Test arithmetic, number sequences, or mathematical logic.",
    spatial: "Generate a spatial reasoning question. Describe a 2D/3D shape manipulation and ask about the result.",
    logic: "Generate a logical reasoning question. Present a logical puzzle, syllogism, or deduction problem.",
};

/**
 * Generate IQ-style multiple choice questions via AI.
 */
export const generateQuestions = action({
    args: {
        category: v.union(
            v.literal("pattern"), v.literal("verbal"), v.literal("numerical"),
            v.literal("spatial"), v.literal("logic")
        ),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
        count: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const count = args.count ?? 5;
        const userId = (await ctx.auth.getUserIdentity())?.subject;
        if (!userId) throw new Error("Not authenticated");

        const systemPrompt = `You are an IQ test question generator. Generate exactly ${count} multiple-choice questions.

${CATEGORY_PROMPTS[args.category]}

Difficulty: ${args.difficulty}

Return a JSON array of questions. Each question must have:
- "questionText": the question (clear, concise)
- "options": array of exactly 4 answer choices (strings)
- "correctIndex": index (0-3) of the correct answer
- "explanation": brief explanation of why the answer is correct

Return ONLY valid JSON array. No markdown fences.`;

        const result = await ctx.runAction(internal.nvidia.callModel, {
            model: "nvidia/nemotron-3-nano-30b-a3b",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate ${count} ${args.difficulty} ${args.category} reasoning questions for an IQ test.` }
            ],
        });

        let questions: Array<{
            questionText: string;
            options: string[];
            correctIndex: number;
            explanation: string;
        }>;

        try {
            const cleaned = (result as string)
                .replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "")
                .replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            questions = JSON.parse(cleaned);
        } catch {
            throw new Error("Failed to parse AI-generated questions");
        }

        // Save questions to DB
        const savedIds: string[] = [];
        for (const q of questions) {
            const id = await ctx.runMutation(internal.questions.saveQuestion, {
                userId,
                category: args.category,
                difficulty: args.difficulty,
                questionText: q.questionText,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
            });
            savedIds.push(id);
        }

        return savedIds;
    }
});

/**
 * Save a question to the database (internal mutation).
 */
export const saveQuestion = internalMutation({
    args: {
        userId: v.string(),
        category: v.union(
            v.literal("pattern"), v.literal("verbal"), v.literal("numerical"),
            v.literal("spatial"), v.literal("logic")
        ),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
        questionText: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        explanation: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("questions", {
            ...args,
            createdAt: Date.now(),
        });
    }
});

/**
 * Save a user's answer.
 */
export const saveAnswer = mutation({
    args: {
        questionId: v.id("questions"),
        testId: v.optional(v.id("iqTests")),
        selectedIndex: v.number(),
        timeSpentMs: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const userId = identity.subject;

        const question = await ctx.db.get(args.questionId);
        if (!question) throw new Error("Question not found");

        const isCorrect = args.selectedIndex === question.correctIndex;

        await ctx.db.insert("answers", {
            userId,
            questionId: args.questionId,
            testId: args.testId,
            selectedIndex: args.selectedIndex,
            isCorrect,
            timeSpentMs: args.timeSpentMs,
            answeredAt: Date.now(),
        });

        return { isCorrect, correctIndex: question.correctIndex, explanation: question.explanation };
    }
});

/**
 * Get questions by category for practice mode.
 */
export const getByCategory = query({
    args: {
        category: v.union(
            v.literal("pattern"), v.literal("verbal"), v.literal("numerical"),
            v.literal("spatial"), v.literal("logic")
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("questions")
            .withIndex("by_category", q => q.eq("category", args.category))
            .order("desc")
            .take(args.limit ?? 10);
    }
});

/**
 * Get user's practice stats.
 */
export const getUserStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const answers = await ctx.db
            .query("answers")
            .withIndex("by_user", q => q.eq("userId", identity.subject))
            .collect();

        const total = answers.length;
        const correct = answers.filter(a => a.isCorrect).length;
        const byCategory: Record<string, { total: number; correct: number }> = {};

        for (const a of answers) {
            const q = await ctx.db.get(a.questionId);
            if (!q) continue;
            if (!byCategory[q.category]) byCategory[q.category] = { total: 0, correct: 0 };
            byCategory[q.category].total++;
            if (a.isCorrect) byCategory[q.category].correct++;
        }

        return { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, byCategory };
    }
});
