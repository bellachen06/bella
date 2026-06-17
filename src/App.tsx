/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  User
} from "firebase/auth";
import { 
  GraduationCap, 
  LogIn, 
  LogOut, 
  Video, 
  Award, 
  Settings, 
  Flame, 
  Loader2, 
  BookOpen, 
  Clock, 
  Github, 
  PlayCircle 
} from "lucide-react";
import { auth, logInWithGoogle, logOut } from "./lib/firebase";
import { dbService } from "./services/dbService";
import { Course, Quiz, UserProgressData } from "./types";
import CourseList from "./components/CourseList";
import CoursePlayer from "./components/CoursePlayer";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // System lists loaded from Firestore
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  
  // App routing/view control
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Authentication & Progress data state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [quizScores, setQuizScores] = useState<{ [quizId: string]: { score: number; total: number } }>({});

  // 1. Core initialization loader
  const loadPlatformData = async () => {
    try {
      setIsLoading(true);
      const fetchedCourses = await dbService.getCourses();
      const fetchedQuizzes = await dbService.getQuizzes();
      setCourses(fetchedCourses);
      setQuizzes(fetchedQuizzes);
    } catch (err) {
      console.error("Cloud synchronisation fallback error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  // 2. Real-time User Profile authentication tracker
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync progress records from cloud Firestore
        try {
          const progress = await dbService.getUserProgress(user.uid);
          if (progress) {
            setCompletedVideos(progress.completedVideos || []);
            setQuizScores(progress.quizScores || {});
          } else {
            // First time user, setup blank stats
            setCompletedVideos([]);
            setQuizScores({});
            await dbService.saveUserProgress(user.uid, {
              userId: user.uid,
              completedVideos: [],
              quizScores: {}
            });
          }
        } catch (err) {
          console.error("Cloud synchronization progress fetch failed:", err);
        }
      } else {
        // Clear on logout
        setCompletedVideos([]);
        setQuizScores({});
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. User Interaction mutations
  const handleToggleComplete = async (courseId: string) => {
    if (!currentUser) {
      alert("請先於右上角登入系統，即可同步個人學習紀錄至雲端！");
      return;
    }

    try {
      setIsSaving(true);
      const nextCompleted = completedVideos.includes(courseId)
        ? completedVideos.filter(id => id !== courseId)
        : [...completedVideos, courseId];

      setCompletedVideos(nextCompleted);

      await dbService.saveUserProgress(currentUser.uid, {
        userId: currentUser.uid,
        completedVideos: nextCompleted,
        quizScores: quizScores
      });
    } catch (error) {
      console.error("Failed to commit progress update:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuizResult = async (quizId: string, score: number, total: number) => {
    if (!currentUser) {
      alert("恭喜您完成互動答題！請先登入系統以便儲存此分數紀錄至個人護照。");
      return;
    }

    try {
      setIsSaving(true);
      const nextScores = {
        ...quizScores,
        [quizId]: { score, total, completedAt: new Date().toISOString() }
      };

      setQuizScores(nextScores);

      await dbService.saveUserProgress(currentUser.uid, {
        userId: currentUser.uid,
        completedVideos: completedVideos,
        quizScores: nextScores
      });
    } catch (error) {
      console.error("Error committing score metrics:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Admin write endpoints
  const handleSaveCourse = async (updatedCourse: Course) => {
    setIsSaving(true);
    try {
      await dbService.saveCourse(updatedCourse);
      const refreshed = await dbService.getCourses();
      setCourses(refreshed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setIsSaving(true);
    try {
      await dbService.deleteCourse(courseId);
      const refreshed = await dbService.getCourses();
      setCourses(refreshed);
      if (activeCourseId === courseId) {
        setActiveCourseId(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuiz = async (updatedQuiz: Quiz) => {
    setIsSaving(true);
    try {
      await dbService.saveQuiz(updatedQuiz);
      const refreshed = await dbService.getQuizzes();
      setQuizzes(refreshed);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCourse = courses.find(c => c.id === activeCourseId) || null;
  const activeQuiz = activeCourse ? quizzes.find(q => q.courseId === activeCourse.id) || null : null;
  const activeQuizScore = activeQuiz ? quizScores[activeQuiz.id] || null : null;

  // Calculators for dashboard metrics
  const totalCompletedCount = completedVideos.length;
  const quizzesCompletedCount = Object.keys(quizScores).length;

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 flex flex-col font-sans" id="app-root-view">
      
      {/* Premium Elegant Navbar - Neo-brutalist style */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-indigo-600 shadow-[0_4px_0_0_#1e293b]" id="platform-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveCourseId(null); setIsAdminMode(false); }}>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-800 block">LEARN.io</span>
              <span className="text-[10px] text-indigo-600 font-mono font-bold tracking-widest uppercase">Firebase Live Tech</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Developer/Creator Panel Toggle Button */}
            <button
              id="btn-toggle-admin-panel"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setActiveCourseId(null);
              }}
              className={`px-4 py-2 rounded-xl border-2 border-slate-800 text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                isAdminMode 
                  ? "bg-amber-300 text-slate-900" 
                  : "bg-white text-slate-600 hover:text-slate-900"
              }`}
              title="進入管理後台"
            >
              <Settings className={`w-3.5 h-3.5 ${isAdminMode ? 'animate-spin' : ''}`} />
              <span>管理中心</span>
            </button>

            {/* Firebase Auth Controls */}
            {currentUser ? (
              <div className="flex items-center gap-3 bg-indigo-50 border-2 border-indigo-600 rounded-xl py-1.5 px-3 shadow-[2px_2px_0px_0px_rgba(79,70,229,0.3)]">
                <div className="text-right hidden md:block">
                  <span className="text-xs font-black text-indigo-950 block max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email || "測試學員"}
                  </span>
                  <span className="text-[9.5px] text-indigo-500 block font-mono font-bold">Authenticated</span>
                </div>
                <button
                  id="btn-auth-logout"
                  onClick={logOut}
                  className="p-1.5 bg-white border border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-300 rounded-lg cursor-pointer transition-all"
                  title="登出系統"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-auth-login"
                onClick={logInWithGoogle}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                登入帳號
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Hero Stats Panel for Gamified Motivation - styled using neo-brutalist parameters */}
      {!isAdminMode && !activeCourseId && (
        <div className="bg-sky-50 border-b-2 border-indigo-100 py-8" id="dashboard-hero-panel">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">後端 Firestore 即時互動大綱</h1>
              <p className="text-slate-500 font-medium text-sm mt-1">
                本系統完全整合雲端資料庫架構，支援多選隨堂測驗評分與影片完成紀錄更新。
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white p-5 rounded-2xl border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] text-slate-900 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-black tracking-wider">看片進度課程</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{totalCompletedCount} <span className="text-slate-400 text-xs font-normal">/ {courses.length} 章</span></span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-300 border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] text-slate-900 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-black tracking-wider">已完成互動測驗</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{quizzesCompletedCount} <span className="text-slate-400 text-xs font-normal">/ {quizzes.length} 回</span></span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-300 border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] text-slate-900 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-black tracking-wider">學習狀態歷程</span>
                  <span className="text-xs font-black text-indigo-700 block truncate max-w-[170px]">
                    {currentUser ? "雲端儲存 (Firebase)" : "訪客（未認證）"}
                  </span>
                </div>
              </div>

              <div className="bg-indigo-600 p-5 rounded-2xl border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-xl bg-white text-slate-900 border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-indigo-200 text-[10px] block uppercase font-black tracking-wider">平台架構核心</span>
                  <span className="text-xs font-black block font-mono">React 19 + Rules</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Main Dynamic Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-24 bg-white rounded-[32px] border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] max-w-2xl mx-auto" id="platform-loading-spinner">
            <Loader2 className="w-12 h-12 mx-auto text-indigo-600 animate-spin mb-4" />
            <p className="text-base font-black text-slate-800">正在與 Firestore 雲端資料庫安全同步中...</p>
            <p className="text-xs text-slate-400 mt-2">Connecting to hello-103c8 project</p>
          </div>
        ) : isAdminMode ? (
          <AdminPanel
            courses={courses}
            quizzes={quizzes}
            onSaveCourse={handleSaveCourse}
            onDeleteCourse={handleDeleteCourse}
            onSaveQuiz={handleSaveQuiz}
            isSaving={isSaving}
          />
        ) : activeCourse ? (
          <CoursePlayer
            course={activeCourse}
            quiz={activeQuiz}
            completedVideos={completedVideos}
            userScore={activeQuizScore}
            onToggleComplete={handleToggleComplete}
            onSaveQuizResult={handleSaveQuizResult}
            onGoBack={() => setActiveCourseId(null)}
            isSavingProgress={isSaving}
          />
        ) : (
          <CourseList
            courses={courses}
            completedVideos={completedVideos}
            quizScores={quizScores}
            activeCourseId={activeCourseId}
            onSelectCourse={(id) => setActiveCourseId(id)}
          />
        )}
      </main>

      {/* Standard Humble Footer */}
      <footer className="bg-white border-t-4 border-slate-800 py-8 text-center text-slate-500 text-xs mt-auto">
        <p className="font-bold">
          © 2026 LEARN.io 雲端觀念學習與互動測驗管理平台 (Firestore + React + Tailwind v4)
        </p>
        <p className="font-mono mt-1 text-slate-400 text-[10px] uppercase tracking-wider">
          Crafted with decoupled architecture & strict schema rules • Project hello-103c8
        </p>
      </footer>
    </div>
  );
}
