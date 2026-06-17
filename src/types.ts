/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
  createdAt?: any;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  createdAt?: any;
}

export interface UserProgressData {
  userId: string;
  displayName?: string;
  completedVideos: string[]; // List of course IDs completed
  quizScores: {
    [quizId: string]: {
      score: number;
      total: number;
      completedAt: string;
    };
  };
  updatedAt: string;
}
