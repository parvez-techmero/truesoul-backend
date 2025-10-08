import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { categoriesTable, topicsTable, subTopicsTable, questionsTable, userAnswersTable, usersTable } from '../../db/schema';
import { eq, or, and } from "drizzle-orm";

const divisionEnum = z.enum(['all', 'your_turn', 'answered', 'completed']);

export class UserProgressDivisions extends OpenAPIRoute {
  schema = {
    tags: ["UserProgress"],
    summary: "Get categories and subtopics divided into progress divisions",
    description: "Returns both categories and subtopics organized by progress status: all, your_turn (remaining), answered (partially completed), and completed (100% done)",
    request: {
      query: z.object({
        userId: z.string().describe("User ID to calculate progress for"),
        division: divisionEnum.describe("Division type: 'all' - all items, 'your_turn' - remaining items, 'answered' - partially answered items, 'completed' - fully completed items"),
        categoryId: z.string().optional().describe("Filter subtopics by specific category ID"),
        topicId: z.string().optional().describe("Filter subtopics by specific topic ID"),
      }),
    },
    responses: {
      "200": {
        description: "Returns divided progress data",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              data: z.object({
                division: z.string(),
                categories: z.array(z.any()),
                subtopics: z.array(z.any()),
                totalCount: z.object({
                  categories: z.number(),
                  subtopics: z.number(),
                  total: z.number(),
                }),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const db = c.get('db');
    const { query } = await this.getValidatedData<typeof this.schema>();
    const { userId, division, categoryId, topicId } = query;

    try {
      // Get categories with progress
      const categories = await this.getCategories(db, parseInt(userId));
      const filteredCategories = this.filterByDivision(categories, division);

      // Get subtopics with progress (filtered by categoryId/topicId if provided)
      const subtopics = await this.getSubtopics(db, parseInt(userId), categoryId, topicId);
      const filteredSubtopics = this.filterByDivision(subtopics, division);

      return c.json({
        success: true,
        data: {
          division,
          categories: filteredCategories,
          subtopics: filteredSubtopics,
          totalCount: {
            categories: filteredCategories.length,
            subtopics: filteredSubtopics.length,
            total: filteredCategories.length + filteredSubtopics.length
          },
          filters: {
            categoryId: categoryId || null,
            topicId: topicId || null
          }
        }
      });
    } catch (err) {
      return c.json({ 
        error: 'Failed to fetch progress divisions', 
        detail: err instanceof Error ? err.message : String(err) 
      }, 500);
    }
  }

  private async getCategories(db, userId: number) {
    // Get all categories
    const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.isActive, true));
    
    const categoriesWithProgress = await Promise.all(
      categories.map(async (category) => {
        // Get all subtopics for this category
        const subTopics = await db
          .select()
          .from(subTopicsTable)
          .where(and(
            eq(subTopicsTable.categoryId, category.id),
            eq(subTopicsTable.isActive, true)
          ));
        
        const subTopicIds = subTopics.map(st => st.id);
        
        // Get all questions for these subtopics
        let questions = [];
        if (subTopicIds.length > 0) {
          questions = await db
            .select()
            .from(questionsTable)
            .where(and(
              or(...subTopicIds.map(stid => eq(questionsTable.subTopicId, stid))),
              eq(questionsTable.isActive, true)
            ));
        }
        
        const totalQuestions = questions.length;
        
        // Get user answers for these questions
        const questionIds = questions.map(q => q.id);
        let answeredCount = 0;
        
        if (questionIds.length > 0) {
          const userAnswers = await db
            .select()
            .from(userAnswersTable)
            .where(and(
              eq(userAnswersTable.userId, userId),
              or(...questionIds.map(qid => eq(userAnswersTable.questionId, qid)))
            ));
          answeredCount = userAnswers.length;
        }
        
        const percent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);
        
        return {
          ...category,
          totalQuestions,
          answeredCount,
          percent,
          progressStatus: this.getProgressStatus(percent, answeredCount)
        };
      })
    );

    return categoriesWithProgress;
  }

  private async getSubtopics(db, userId: number, categoryId?: string, topicId?: string) {
    // Get user's hideContent setting
    const [user] = await db.select({ hideContent: usersTable.hideContent })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    
    // Build subtopic filter conditions
    const conditions = [eq(subTopicsTable.isActive, true)];
    
    // Filter adult content if user has hideContent enabled
    if (user?.hideContent) {
      conditions.push(eq(subTopicsTable.adult, false));
    }
    
    if (categoryId) {
      conditions.push(eq(subTopicsTable.categoryId, parseInt(categoryId)));
    }
    
    if (topicId) {
      conditions.push(eq(subTopicsTable.topicId, parseInt(topicId)));
    }
    
    // Get subtopics based on filters
    const subTopics = await db
      .select()
      .from(subTopicsTable)
      .where(and(...conditions));
    
    const subTopicsWithProgress = await Promise.all(
      subTopics.map(async (subTopic) => {
        // Get all questions for this subtopic
        const questions = await db
          .select()
          .from(questionsTable)
          .where(and(
            eq(questionsTable.subTopicId, subTopic.id),
            eq(questionsTable.isActive, true)
          ));
        
        const totalQuestions = questions.length;
        
        // Get user answers for these questions
        const questionIds = questions.map(q => q.id);
        let answeredCount = 0;
        
        if (questionIds.length > 0) {
          const userAnswers = await db
            .select()
            .from(userAnswersTable)
            .where(and(
              eq(userAnswersTable.userId, userId),
              or(...questionIds.map(qid => eq(userAnswersTable.questionId, qid)))
            ));
          answeredCount = userAnswers.length;
        }
        
        const percent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);
        
        return {
          ...subTopic,
          totalQuestions,
          answeredCount,
          percent,
          progressStatus: this.getProgressStatus(percent, answeredCount)
        };
      })
    );

    return subTopicsWithProgress;
  }

  private getProgressStatus(percent: number, answeredCount: number): string {
    if (percent === 100) return 'completed';
    if (answeredCount > 0) return 'answered';
    return 'your_turn';
  }

  private filterByDivision(items: any[], division: string): any[] {
    switch (division) {
      case 'all':
        return items;
      case 'your_turn':
        return items.filter(item => item.progressStatus === 'your_turn');
      case 'answered':
        return items.filter(item => item.progressStatus === 'answered');
      case 'completed':
        return items.filter(item => item.progressStatus === 'completed');
      default:
        return items;
    }
  }
}