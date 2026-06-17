/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Course, Quiz, UserProgressData, Question } from "../types";

// Seed data to automatically populate the Firestore if it starts completely empty.
// Provides a highly polished out-of-the-box system with real web development/creative computing tutorials.
const SEED_COURSES: Course[] = [
  {
    id: "course-react-basics",
    title: "React 19 & Modern Web Development Fundamentals",
    description: "Learn instructions, React Hooks, and the fundamental mechanics of component structures. Designed with clean Tailwind visuals.",
    videoUrl: "https://www.youtube.com/watch?v=8pDquaT5QOM", // Popular React video reference
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=640&auto=format&fit=crop",
    duration: "18:40",
    category: "React / Frontend",
    difficulty: "Beginner"
  },
  {
    id: "course-tailwind-styling",
    title: "Mastering Tailwind CSS v4 Layouts & Typography",
    description: "Deep dive into CSS utility layers, CSS variables-driven themes, spacing ratios, and responsive desktop fluid configurations.",
    videoUrl: "https://www.youtube.com/watch?v=mSgXAt5pXh0", // Popular CSS / Tailwind design video
    thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=640&auto=format&fit=crop",
    duration: "14:15",
    category: "Design / CSS",
    difficulty: "Intermediate"
  },
  {
    id: "course-firestore-deepdive",
    title: "Firebase Firestore Architectures & Hardened Security Rules",
    description: "Connect standard collections, design nested schemas, and craft mathematically robust ABAC security guardrails.",
    videoUrl: "https://www.youtube.com/watch?v=35RlydUf6xo", // Firebase video tutorial reference
    thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=640&auto=format&fit=crop",
    duration: "25:30",
    category: "Database / Backend",
    difficulty: "Advanced"
  }
];

const SEED_QUIZZES: Quiz[] = [
  {
    id: "quiz-react",
    courseId: "course-react-basics",
    title: "React 19 Core Mechanics Assessment",
    questions: [
      {
        id: "q1",
        questionText: "Which React hook is commonly utilized to perform side-effects in a functional component, and should restrict non-primitive arrays in its dependencies?",
        options: ["useState", "useEffect", "useMemo", "useContext"],
        correctIndex: 1,
        explanation: "useEffect is used to manage lifecycle actions and external API subscriptions. Its dependencies must be stabilized to bypass infinite re-renders."
      },
      {
        id: "q2",
        questionText: "What key advantage does React 19 introduce regarding Server Components and Actions?",
        options: [
          "Direct database triggers via useActionState",
          "Decoupled browser execution using standard async states",
          "Automated server-to-client function triggers during event handlers",
          "Slower hydration loops"
        ],
        correctIndex: 2,
        explanation: "React 19 form actions and status states support seamless async mutations that handle pending states natively."
      }
    ]
  },
  {
    id: "quiz-tailwind",
    courseId: "course-tailwind-styling",
    title: "Tailwind CSS Layout & Utility Assessment",
    questions: [
      {
        id: "q1",
        questionText: "How are Tailwind v4 themes declaring variables in index.css as standard configurations?",
        options: [
          "Using standard @theme and CSS custom properties namespace",
          "Using standard configuration files like tailwind.config.js only",
          "Declaring nested javascript styles inside components",
          "Modifying standard HTML template configurations"
        ],
        correctIndex: 0,
        explanation: "Tailwind v4 features CSS-first configuration using `@theme` inside standard CSS files."
      }
    ]
  },
  {
    id: "quiz-firestore",
    courseId: "course-firestore-deepdive",
    title: "Firestore Security Rules and Zero-Trust Assessment",
    questions: [
      {
        id: "q1",
        questionText: "Why is placing get() lookups inside an allow 'list' rule discouraged by database security principles?",
        options: [
          "It slows down single document reads",
          "It causes O(n) database read cost explosions and quota depletion",
          "It prevents the client from writing data",
          "It throws compilation syntax errors instantly"
        ],
        correctIndex: 1,
        explanation: "Listing collections with embedded get() checks triggers cross-lookups for every item, resulting in quick quota exhaustion. Relational filters on resource.data should be preferred."
      }
    ]
  }
];

export const dbService = {
  /**
   * Fetch all courses. Seeds the collection with sample chapters if empty.
   */
  async getCourses(): Promise<Course[]> {
    const colName = "courses";
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) {
        // Automatically seed for user's convenience
        console.log("No courses found. Seeding initial learning chapters...");
        for (const c of SEED_COURSES) {
          await setDoc(doc(db, colName, c.id), {
            ...c,
            createdAt: serverTimestamp()
          });
        }
        return SEED_COURSES;
      }
      return snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Course[];
    } catch (error) {
      // Catch permission failures or configuration errors with the standard system error framework
      return handleFirestoreError(error, OperationType.LIST, colName);
    }
  },

  /**
   * Save a single course (Admin feature to support Course Management).
   */
  async saveCourse(course: Omit<Course, "id"> & { id?: string }): Promise<string> {
    const colName = "courses";
    try {
      const id = course.id || `course-${Date.now()}`;
      await setDoc(doc(db, colName, id), {
        ...course,
        id,
        createdAt: serverTimestamp()
      }, { merge: true });
      return id;
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, `${colName}/${course.id || 'new'}`);
    }
  },

  /**
   * Delete a course (Admin feature).
   */
  async deleteCourse(courseId: string): Promise<void> {
    const colName = "courses";
    try {
      await deleteDoc(doc(db, colName, courseId));
    } catch (error) {
      return handleFirestoreError(error, OperationType.DELETE, `${colName}/${courseId}`);
    }
  },

  /**
   * Fetch quizzes. Seeds default questions if missing.
   */
  async getQuizzes(): Promise<Quiz[]> {
    const colName = "quizzes";
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) {
        console.log("No quizzes found. Seeding modern video assessments...");
        for (const q of SEED_QUIZZES) {
          await setDoc(doc(db, colName, q.id), {
            ...q,
            createdAt: serverTimestamp()
          });
        }
        return SEED_QUIZZES;
      }
      return snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Quiz[];
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, colName);
    }
  },

  /**
   * Save or update interactive quizzes (Admin feature).
   */
  async saveQuiz(quiz: Quiz): Promise<void> {
    const colName = "quizzes";
    try {
      await setDoc(doc(db, colName, quiz.id), {
        ...quiz,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, `${colName}/${quiz.id}`);
    }
  },

  /**
   * Fetch user learning profile and course completion metrics.
   */
  async getUserProgress(userId: string): Promise<UserProgressData | null> {
    const path = `userProgress/${userId}`;
    try {
      const docSnap = await getDoc(doc(db, "userProgress", userId));
      if (!docSnap.exists()) {
        return null;
      }
      return docSnap.data() as UserProgressData;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Update video completion or quiz scores inside Firestore.
   */
  async saveUserProgress(userId: string, progress: Partial<UserProgressData>): Promise<void> {
    const path = `userProgress/${userId}`;
    try {
      await setDoc(doc(db, "userProgress", userId), {
        userId,
        completedVideos: progress.completedVideos || [],
        quizScores: progress.quizScores || {},
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
