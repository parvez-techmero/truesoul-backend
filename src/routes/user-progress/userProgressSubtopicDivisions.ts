import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { 
  subTopicsTable, 
  questionsTable, 
  userAnswersTable, 
  relationshipsTable, 
  usersTable,
  topicsTable,
  categoriesTable
} from '../../db/schema';
import { eq, or, and } from "drizzle-orm";

const divisionEnum = z.enum(['unanswered', 'your_turn', 'answered', 'complete', 'all']);

export class UserProgressSubtopicDivisions extends OpenAPIRoute {
  schema = {
    tags: ["UserProgress"],
    summary: "Get subtopics divided by user progress status",
    description: "Divides subtopics into divisions: 'unanswered' (no answers from anyone), 'your_turn' (remaining questions for user), 'answered' (partially completed), 'complete' (both users completed), 'all' (all subtopics)",
    request: {
      query: z.object({
        userId: z.string().describe("User ID to calculate progress for"),
        division: divisionEnum.describe("Division type to filter by"),
        topicId: z.string().optional().describe("Filter by specific topic ID"),
        categoryId: z.string().optional().describe("Filter by specific category ID"),
      }),
    },
    responses: {
      "200": {
        description: "Returns subtopics filtered by division",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              data: z.object({
                division: z.string(),
                subtopics: z.array(z.object({
                  id: z.number(),
                  name: z.string(),
                  description: z.string().nullable(),
                  icon: z.string().nullable(),
                  color: z.string().nullable(),
                  adult: z.boolean(),
                  topicId: z.number().nullable(),
                  categoryId: z.number().nullable(),
                  topicName: z.string().nullable(),
                  categoryName: z.string().nullable(),
                  totalQuestions: z.number(),
                  userAnsweredCount: z.number(),
                  partnerAnsweredCount: z.number(),
                  userProgress: z.number(),
                  partnerProgress: z.number(),
                  overallProgress: z.number(),
                  status: z.string(),
                  isCompleted: z.boolean(),
                })),
                summary: z.object({
                  totalSubtopics: z.number(),
                  unansweredCount: z.number(),
                  yourTurnCount: z.number(),
                  answeredCount: z.number(),
                  completeCount: z.number(),
                }),
                relationship: z.object({
                  hasPartner: z.boolean(),
                  partnerId: z.number().nullable(),
                  partnerName: z.string().nullable(),
                }).nullable(),
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
    const { userId, division, topicId, categoryId } = query;

    try {
      const userIdNum = parseInt(userId);
      
      // Get user's hideContent setting
      const [user] = await db.select({ hideContent: usersTable.hideContent })
        .from(usersTable)
        .where(eq(usersTable.id, userIdNum));
      
      if (!user) {
        return c.json({ success: false, message: 'User not found' }, 404);
      }
      
      // Get user's relationship and partner info
      const relationshipInfo = await this.getUserRelationship(db, userIdNum);
      
      // Build subtopic filter conditions
      const conditions = [eq(subTopicsTable.isActive, true)];
      
      // Filter adult content if user has hideContent enabled
      if (user.hideContent) {
        conditions.push(eq(subTopicsTable.adult, false));
      }
      
      if (topicId) {
        conditions.push(eq(subTopicsTable.topicId, parseInt(topicId)));
      }
      
      if (categoryId) {
        conditions.push(eq(subTopicsTable.categoryId, parseInt(categoryId)));
      }
      
      // Get all subtopics based on filters with topic and category names
      const subTopics = await db
        .select({
          id: subTopicsTable.id,
          name: subTopicsTable.name,
          description: subTopicsTable.description,
          icon: subTopicsTable.icon,
          color: subTopicsTable.color,
          adult: subTopicsTable.adult,
          topicId: subTopicsTable.topicId,
          categoryId: subTopicsTable.categoryId,
          sortOrder: subTopicsTable.sortOrder,
          isActive: subTopicsTable.isActive,
          createdAt: subTopicsTable.createdAt,
          updatedAt: subTopicsTable.updatedAt,
          topicName: topicsTable.name,
          categoryName: categoriesTable.name,
        })
        .from(subTopicsTable)
        .leftJoin(topicsTable, eq(subTopicsTable.topicId, topicsTable.id))
        .leftJoin(categoriesTable, eq(subTopicsTable.categoryId, categoriesTable.id))
        .where(and(...conditions));
      
      // Calculate progress for each subtopic
      const subtopicsWithProgress = await Promise.all(
        subTopics.map(async (subTopic) => {
          const progress = await this.calculateSubtopicProgress(
            db, 
            subTopic, 
            userIdNum, 
            relationshipInfo.partnerId
          );
          return progress;
        })
      );
      
      // Filter by division
      const filteredSubtopics = this.filterByDivision(subtopicsWithProgress, division);
      
      // Calculate summary
      const summary = this.calculateSummary(subtopicsWithProgress);
      
      return c.json({
        success: true,
        data: {
          division,
          subtopics: filteredSubtopics,
          summary,
          relationship: relationshipInfo,
        }
      });
      
    } catch (err) {
      return c.json({ 
        error: 'Failed to fetch subtopic divisions', 
        detail: err instanceof Error ? err.message : String(err) 
      }, 500);
    }
  }

  private async getUserRelationship(db, userId: number) {
    try {
      // Find user's active relationship
      const relationship = await db
        .select({
          id: relationshipsTable.id,
          user1Id: relationshipsTable.user1Id,
          user2Id: relationshipsTable.user2Id,
        })
        .from(relationshipsTable)
        .where(
          and(
            or(
              eq(relationshipsTable.user1Id, userId),
              eq(relationshipsTable.user2Id, userId)
            ),
            eq(relationshipsTable.deleted, false)
          )
        );

      if (!relationship.length) {
        return {
          hasPartner: false,
          partnerId: null,
          partnerName: null,
        };
      }

      const rel = relationship[0];
      const partnerId = rel.user1Id === userId ? rel.user2Id : rel.user1Id;
      
      // Get partner's name
      const partner = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, partnerId));

      return {
        hasPartner: true,
        partnerId,
        partnerName: partner[0]?.name || 'Unknown',
      };
    } catch (error) {
      return {
        hasPartner: false,
        partnerId: null,
        partnerName: null,
      };
    }
  }

  private async calculateSubtopicProgress(db, subTopic, userId: number, partnerId: number | null) {
    // Get all questions for this subtopic
    const questions = await db
      .select()
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.subTopicId, subTopic.id),
          eq(questionsTable.isActive, true)
        )
      );

    const totalQuestions = questions.length;
    const questionIds = questions.map(q => q.id);
    
    // Get user's answers
    let userAnsweredCount = 0;
    if (questionIds.length > 0) {
      const userAnswers = await db
        .select()
        .from(userAnswersTable)
        .where(
          and(
            eq(userAnswersTable.userId, userId),
            or(...questionIds.map(qid => eq(userAnswersTable.questionId, qid)))
          )
        );
      userAnsweredCount = userAnswers.length;
    }

    // Get partner's answers (if partner exists)
    let partnerAnsweredCount = 0;
    if (partnerId && questionIds.length > 0) {
      const partnerAnswers = await db
        .select()
        .from(userAnswersTable)
        .where(
          and(
            eq(userAnswersTable.userId, partnerId),
            or(...questionIds.map(qid => eq(userAnswersTable.questionId, qid)))
          )
        );
      partnerAnsweredCount = partnerAnswers.length;
    }

    const userProgress = totalQuestions === 0 ? 0 : Math.round((userAnsweredCount / totalQuestions) * 100);
    const partnerProgress = totalQuestions === 0 ? 0 : Math.round((partnerAnsweredCount / totalQuestions) * 100);
    
    // Calculate overall progress and status
    const { overallProgress, status, isCompleted } = this.calculateStatus(
      userProgress, 
      partnerProgress, 
      userAnsweredCount, 
      partnerId !== null,
      partnerAnsweredCount
    );

    return {
      ...subTopic,
      totalQuestions,
      userAnsweredCount,
      partnerAnsweredCount,
      userProgress,
      partnerProgress,
      overallProgress,
      status,
      isCompleted,
    };
  }

  private calculateStatus(userProgress: number, partnerProgress: number, userAnsweredCount: number, hasPartner: boolean, partnerAnsweredCount?: number) {
    if (hasPartner) {
      // Both users need to complete for "complete" status
      if (userProgress === 100 && partnerProgress === 100) {
        return {
          overallProgress: 100,
          status: 'complete',
          isCompleted: true,
        };
      } else if (userAnsweredCount > 0 || (partnerAnsweredCount && partnerAnsweredCount > 0)) {
        // Someone has answered some questions
        if (userAnsweredCount > 0) {
          return {
            overallProgress: Math.round((userProgress + partnerProgress) / 2),
            status: 'answered',
            isCompleted: false,
          };
        } else {
          // Partner has answered but user hasn't
          return {
            overallProgress: Math.round((userProgress + partnerProgress) / 2),
            status: 'your_turn',
            isCompleted: false,
          };
        }
      } else {
        // Neither user has answered any questions
        return {
          overallProgress: 0,
          status: 'unanswered',
          isCompleted: false,
        };
      }
    } else {
      // Single user - only user progress matters
      if (userProgress === 100) {
        return {
          overallProgress: userProgress,
          status: 'complete',
          isCompleted: true,
        };
      } else if (userAnsweredCount > 0) {
        return {
          overallProgress: userProgress,
          status: 'answered',
          isCompleted: false,
        };
      } else {
        return {
          overallProgress: 0,
          status: 'unanswered',
          isCompleted: false,
        };
      }
    }
  }

  private filterByDivision(subtopics: any[], division: string): any[] {
    switch (division) {
      case 'unanswered':
        return subtopics.filter(item => item.status === 'unanswered');
      case 'your_turn':
        return subtopics.filter(item => item.status === 'your_turn');
      case 'answered':
        return subtopics.filter(item => item.status === 'answered');
      case 'complete':
        return subtopics.filter(item => item.status === 'complete');
      case 'all':
      default:
        return subtopics;
    }
  }

  private calculateSummary(subtopics: any[]) {
    return {
      totalSubtopics: subtopics.length,
      unansweredCount: subtopics.filter(item => item.status === 'unanswered').length,
      yourTurnCount: subtopics.filter(item => item.status === 'your_turn').length,
      answeredCount: subtopics.filter(item => item.status === 'answered').length,
      completeCount: subtopics.filter(item => item.status === 'complete').length,
    };
  }
}