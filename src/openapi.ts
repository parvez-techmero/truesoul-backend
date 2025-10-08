import { ResultGetByRelationshipAndSubtopic } from "./routes/result-endpoints/resultGet";
import { JournalCreate } from "./routes/journal-endpoints/journalCreate";
import { JournalGet } from "./routes/journal-endpoints/journalGet";
import { JournalList } from "./routes/journal-endpoints/journalList";
import { JournalUpdate } from "./routes/journal-endpoints/journalUpdate";
import { JournalDelete } from "./routes/journal-endpoints/journalDelete";
import { JournalAll } from "./routes/journal-endpoints/journalAll";
import { JournalCommentCreate } from "./routes/journal-endpoints/journalCommentCreate";
import { JournalCommentList } from "./routes/journal-endpoints/journalCommentList";
import { fromHono } from "chanfana";
import { UserList } from "./routes/user-endpoints/userList";
import { UserListDeleted } from "./routes/user-endpoints/userListDeleted";
import { UserGet } from "./routes/user-endpoints/userGet";
import { UserUpdate } from "./routes/user-endpoints/userUpdate";
import { UserDelete } from "./routes/user-endpoints/userDelete";
import { UserSoftDelete } from "./routes/user-endpoints/userSoftDelete";
import { UserRestore } from "./routes/user-endpoints/userRestore";
import { RelationshipList } from "./routes/relationship-endpoints/relationshipList";
import { RelationshipGet } from "./routes/relationship-endpoints/relationshipGet";
import { RelationshipCreate } from "./routes/relationship-endpoints/relationshipCreate";
import { RelationshipUpdate } from "./routes/relationship-endpoints/relationshipUpdate";
import { RelationshipDelete } from "./routes/relationship-endpoints/relationshipDelete";

import { CategoryList } from "./routes/category-endpoints/categoryList";
import { CategoryGet } from "./routes/category-endpoints/categoryGet";
import { CategoryCreate } from "./routes/category-endpoints/categoryCreate";
import { CategoryUpdate } from "./routes/category-endpoints/categoryUpdate";
import { CategoryDelete } from "./routes/category-endpoints/categoryDelete";

import { TopicList } from "./routes/topic-endpoints/topicList";
import { TopicGet } from "./routes/topic-endpoints/topicGet";
import { TopicCreate } from "./routes/topic-endpoints/topicCreate";
import { TopicUpdate } from "./routes/topic-endpoints/topicUpdate";
import { TopicDelete } from "./routes/topic-endpoints/topicDelete";

import { SubTopicList } from "./routes/sub-topic-endpoints/subTopicList";
import { SubTopicGet } from "./routes/sub-topic-endpoints/subTopicGet";
import { SubTopicCreate } from "./routes/sub-topic-endpoints/subTopicCreate";
import { SubTopicUpdate } from "./routes/sub-topic-endpoints/subTopicUpdate";
import { SubTopicDelete } from "./routes/sub-topic-endpoints/subTopicDelete";

import { QuestionList } from "./routes/question-endpoints/questionList";
import { QuestionGet } from "./routes/question-endpoints/questionGet";
import { QuestionCreate } from "./routes/question-endpoints/questionCreate";
import { QuestionUpdate } from "./routes/question-endpoints/questionUpdate";
import { QuestionDelete } from "./routes/question-endpoints/questionDelete";

// import { AnswerOptionList } from "./routes/answer-option-endpoints/answerOptionList";
// import { AnswerOptionGet } from "./routes/answer-option-endpoints/answerOptionGet";
// import { AnswerOptionCreate } from "./routes/answer-option-endpoints/answerOptionCreate";
// import { AnswerOptionUpdate } from "./routes/answer-option-endpoints/answerOptionUpdate";
// import { AnswerOptionDelete } from "./routes/answer-option-endpoints/answerOptionDelete";

import { UserAnswerList } from "./routes/user-answer-endpoints/userAnswerList";
import { UserAnswerGet } from "./routes/user-answer-endpoints/userAnswerGet";
import { UserAnswerCreate } from "./routes/user-answer-endpoints/userAnswerCreate";
import { UserAnswerBulkCreate } from "./routes/user-answer-endpoints/userAnswerBulkCreate";
import { UserAnswerUpdate } from "./routes/user-answer-endpoints/userAnswerUpdate";
import { UserAnswerDelete } from "./routes/user-answer-endpoints/userAnswerDelete";
import { UserAnswerWithImage } from "./routes/user-answer-endpoints/userAnswerWithImage";
import { UserCreate } from "./routes/user-endpoints/userCreate";
import { UserProfileImageUpdate } from "./routes/user-endpoints/userProfileUpdate";
import { RelationshipCreateWithInviteCode } from "./routes/relationship-endpoints/relationshipCreateWithInviteCode";
import { SubTopicWithQuestionsList } from "./routes/sub-topic-endpoints/subTopicWithQuestionsList";
import { UserProgressBySubtopic } from "./routes/user-progress/userProgressBySubtopic";
import { UserProgressByTopic, UserProgressByCategory } from "./routes/user-progress/userProgressByTopicAndCategory";
import { UserProgressDivisions } from "./routes/user-progress/userProgressDivisions";
import { UserProgressSubtopicDivisions } from "./routes/user-progress/userProgressSubtopicDivisions";
import { HomeGet } from "./routes/home-endpoints/home";

import { DailyQuestionsGet } from "./routes/home-endpoints/dailyQuestions";

import { RandomSubTopicsGet } from "./routes/home-endpoints/randomSubTopic";
import { StreakSingleUserGet } from "./routes/streak-endpoints/streakSingleUser";
import { RecordAppOpenPost } from "./routes/streak-endpoints/recordAppOpen";
import { StreakRelationshipGet } from "./routes/streak-endpoints/streakRelationship";

export function setUpOpenAPI(app) {
    const openapi = fromHono(app, {
        docs_url: "/docs",
        schema: {
            info: {
                title: "Truesoul API",
                version: "1.0.0",
                description: "API for Truesoul backend",
            },
        }
    });

    // User endpoints
    // openapi.get(`/api/users`, UserList);
    openapi.get(`/api/users/deleted`, UserListDeleted); // List deleted users (admin)
    openapi.get(`/api/users/:id`, UserGet);
    openapi.post(`/api/users`, UserCreate);
    openapi.put(`/api/users/:id`, UserUpdate);
    openapi.delete(`/api/users/:id`, UserDelete); // Hard delete (permanent)
    openapi.delete(`/api/users/:id/soft`, UserSoftDelete); // Soft delete (recoverable)
    openapi.put(`/api/users/:id/restore`, UserRestore); // Restore soft deleted user
    openapi.post(`/api/users/:id/profile-image`, UserProfileImageUpdate);

    // Relationship endpoints
    openapi.get(`/api/relationships`, RelationshipList);
    openapi.get(`/api/relationships/get`, RelationshipGet);
    openapi.post(`/api/relationships`, RelationshipCreate);
    openapi.post(`/api/relationships/invite`, RelationshipCreateWithInviteCode);
    openapi.put(`/api/relationships/:id`, RelationshipUpdate);
    openapi.delete(`/api/relationships/:id`, RelationshipDelete);

    // Category endpoints
    openapi.get(`/api/categories`, CategoryList);
    openapi.get(`/api/categories/:id`, CategoryGet);
    openapi.post(`/api/categories`, CategoryCreate);
    openapi.put(`/api/categories/:id`, CategoryUpdate);
    openapi.delete(`/api/categories/:id`, CategoryDelete);

    // Topic endpoints
    openapi.get(`/api/topics`, TopicList);
    openapi.get(`/api/topics/:id`, TopicGet);
    openapi.post(`/api/topics`, TopicCreate);
    openapi.put(`/api/topics/:id`, TopicUpdate);
    openapi.delete(`/api/topics/:id`, TopicDelete);

    // SubTopic endpoints
    openapi.get(`/api/sub-topics`, SubTopicList);
    openapi.get(`/api/sub-topics/with-questions`, SubTopicWithQuestionsList);
    openapi.get(`/api/sub-topics/:id`, SubTopicGet);
    openapi.post(`/api/sub-topics`, SubTopicCreate);
    openapi.put(`/api/sub-topics/:id`, SubTopicUpdate);
    openapi.delete(`/api/sub-topics/:id`, SubTopicDelete);

    // User Progress endpoints
    openapi.get(`/api/user-progress/by-subtopic`, UserProgressBySubtopic);
    openapi.get(`/api/user-progress/by-topic`, UserProgressByTopic);
    openapi.get(`/api/user-progress/by-category`, UserProgressByCategory);
    openapi.get(`/api/user-progress/divisions`, UserProgressDivisions);
    openapi.get(`/api/user-progress/subtopic-divisions`, UserProgressSubtopicDivisions);

    // Question endpoints
    openapi.get(`/api/questions`, QuestionList);
    openapi.get(`/api/questions/:id`, QuestionGet);
    openapi.post(`/api/questions`, QuestionCreate);
    openapi.put(`/api/questions/:id`, QuestionUpdate);
    openapi.delete(`/api/questions/:id`, QuestionDelete);

    // Streak endpoints
    openapi.get(`/api/streak/single-user`, StreakSingleUserGet);
    openapi.get(`/api/streak/relationship`, StreakRelationshipGet);
    openapi.post(`/api/streak/record-app-open`, RecordAppOpenPost);


    // User Answer endpoints
    openapi.get(`/api/user-answers`, UserAnswerList);
    openapi.get(`/api/user-answers/:id`, UserAnswerGet);
    openapi.post(`/api/user-answers`, UserAnswerCreate);
    openapi.post(`/api/user-answers/bulk`, UserAnswerBulkCreate);
    openapi.post(`/api/user-answers/with-image`, UserAnswerWithImage);
    openapi.put(`/api/user-answers/:id`, UserAnswerUpdate);
    openapi.delete(`/api/user-answers/:id`, UserAnswerDelete);

    // Journal endpoints
    openapi.get(`/api/journals/all`, JournalAll); // All journals datewise
    openapi.post(`/api/journal-create`, JournalCreate);
    openapi.get(`/api/journals/:id`, JournalGet);
    openapi.get(`/api/journals`, JournalList);
    openapi.post(`/api/journals`, JournalUpdate);
    openapi.delete(`/api/journals/:id`, JournalDelete);
    openapi.post(`/api/journals/:id/comment`, JournalCommentCreate);
    openapi.get(`/api/journals/:id/comments`, JournalCommentList);

    // Result endpoints
    openapi.get(`/api/results/by-relationship-and-subtopic`, ResultGetByRelationshipAndSubtopic);
    openapi.get(`/api/results/single-question`, require('./routes/result-endpoints/resultSingle').ResultSingleQuestion);

    // Home endpoints
    openapi.get(`/api/home`, HomeGet);

    // Random Subtopics endpoint
    openapi.get(`/api/home/random-subtopics`, RandomSubTopicsGet);

    // Daily Questions endpoint
    openapi.get(`/api/daily-questions`, DailyQuestionsGet);

    return openapi;
}