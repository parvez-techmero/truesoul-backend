import { fromHono } from "chanfana";
import { UserList } from "./routes/user-endpoints/userList";
import { UserGet } from "./routes/user-endpoints/userGet";
import { UserUpdate } from "./routes/user-endpoints/userUpdate";
import { UserDelete } from "./routes/user-endpoints/userDelete";
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

import { AnswerOptionList } from "./routes/answer-option-endpoints/answerOptionList";
import { AnswerOptionGet } from "./routes/answer-option-endpoints/answerOptionGet";
import { AnswerOptionCreate } from "./routes/answer-option-endpoints/answerOptionCreate";
import { AnswerOptionUpdate } from "./routes/answer-option-endpoints/answerOptionUpdate";
import { AnswerOptionDelete } from "./routes/answer-option-endpoints/answerOptionDelete";

import { UserAnswerList } from "./routes/user-answer-endpoints/userAnswerList";
import { UserAnswerGet } from "./routes/user-answer-endpoints/userAnswerGet";
import { UserAnswerCreate } from "./routes/user-answer-endpoints/userAnswerCreate";
import { UserAnswerUpdate } from "./routes/user-answer-endpoints/userAnswerUpdate";
import { UserAnswerDelete } from "./routes/user-answer-endpoints/userAnswerDelete";
import { UserCreate } from "./routes/user-endpoints/userCreate";
import { RelationshipCreateWithInviteCode } from "./routes/relationship-endpoints/relationshipCreateWithInviteCode";
import { SubTopicWithQuestionsList } from "./routes/sub-topic-endpoints/subTopicWithQuestionsList";

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
    openapi.get(`/api/users`, UserList);
    openapi.get(`/api/users/:id`, UserGet);
    openapi.post(`/api/users`, UserCreate);
    openapi.put(`/api/users/:id`, UserUpdate);
    openapi.delete(`/api/users/:id`, UserDelete);

    // Relationship endpoints
    openapi.get(`/api/relationships`, RelationshipList);
    openapi.get(`/api/relationships/:id`, RelationshipGet);
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

    // Question endpoints
    openapi.get(`/api/questions`, QuestionList);
    openapi.get(`/api/questions/:id`, QuestionGet);
    openapi.post(`/api/questions`, QuestionCreate);
    openapi.put(`/api/questions/:id`, QuestionUpdate);
    openapi.delete(`/api/questions/:id`, QuestionDelete);

    // Answer Option endpoints
    openapi.get(`/api/answer-options`, AnswerOptionList);
    openapi.get(`/api/answer-options/:id`, AnswerOptionGet);
    openapi.post(`/api/answer-options`, AnswerOptionCreate);
    openapi.put(`/api/answer-options/:id`, AnswerOptionUpdate);
    openapi.delete(`/api/answer-options/:id`, AnswerOptionDelete);

    // User Answer endpoints
    openapi.get(`/api/user-answers`, UserAnswerList);
    openapi.get(`/api/user-answers/:id`, UserAnswerGet);
    openapi.post(`/api/user-answers`, UserAnswerCreate);
    openapi.put(`/api/user-answers/:id`, UserAnswerUpdate);
    openapi.delete(`/api/user-answers/:id`, UserAnswerDelete);

    return openapi;
}