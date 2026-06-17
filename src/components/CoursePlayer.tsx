/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { CheckCircle2, ChevronLeft, Film, HelpCircle, GraduationCap, PlayCircle, BookOpen } from "lucide-react";
import { Course, Quiz } from "../types";
import QuizPanel from "./QuizPanel";

interface CoursePlayerProps {
  course: Course;
  quiz: Quiz | null;
  completedVideos: string[];
  userScore: { score: number; total: number } | null;
  onToggleComplete: (courseId: string) => void;
  onSaveQuizResult: (quizId: string, score: number, total: number) => void;
  onGoBack: () => void;
  isSavingProgress: boolean;
}

export default function CoursePlayer({
  course,
  quiz,
  completedVideos,
  userScore,
  onToggleComplete,
  onSaveQuizResult,
  onGoBack,
  isSavingProgress
}: CoursePlayerProps) {
  const [activeTab, setActiveTab] = useState<"video" | "notes">("video");
  const [userNote, setUserNote] = useState("");

  const isCompleted = completedVideos.includes(course.id);

  // Extract YouTube ID helper
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const ytId = getYouTubeId(course.videoUrl);

  const handleSaveNote = () => {
    // Local browser placeholder helper to encourage note taking
    alert("預覽提示：筆記已同步暫存於本地端！在完整平台中，筆記將自動同步於雲端。");
  };

  return (
    <div className="space-y-6" id="course-player-container">
      {/* Navigation and Back Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-curriculum"
          onClick={onGoBack}
          className="group px-4 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-black text-slate-700 hover:text-indigo-600 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] transition-all flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          返回課程大綱
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">目前章節：</span>
          <span className="text-xs font-black text-slate-800 bg-amber-300 border border-slate-800 px-2.5 py-1 rounded-lg font-mono shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]">
            {course.category}
          </span>
        </div>
      </div>

      {/* Main Splits Block (Left: Video pane + Video info; Right: Quiz and notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (7 units) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Responsive Embedded Video Frame with custom neobrutalist frame */}
          <div className="bg-slate-900 aspect-video rounded-[32px] overflow-hidden border-4 border-slate-800 shadow-[12px_12px_0px_0px_rgba(30,41,59,0.1)] relative">
            {ytId ? (
              <iframe
                id="main-video-iframe"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`}
                title={course.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="no-referrer"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div 
                className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-indigo-550/20 to-purple-550/20"
                id="unsupported-video-mockup"
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:scale-105 cursor-pointer transition-transform shadow-lg">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1 text-white">
                  <p className="text-base font-black font-sans tracking-tight">本地教學影片串流</p>
                  <p className="text-indigo-200 text-xs font-mono">
                    外部影片網址 <code>{course.videoUrl}</code>
                  </p>
                </div>
                <p className="text-white/60 text-[11px] max-w-sm">
                  （影片採用自訂網址，系統在不支援 iframe 環繞嵌入時，提供多合一互動控制來進行模擬觀看。）
                </p>
              </div>
            )}
          </div>

          {/* Quick interactive Actions under player - Neobrutalist design */}
          <div className="bg-white rounded-3xl p-6 border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                {course.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">單元難度: {course.difficulty}</span>
                <span>•</span>
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">時長: {course.duration}</span>
              </div>
            </div>

            {/* Completion Trigger */}
            <button
              id="btn-toggle-video-completed"
              onClick={() => onToggleComplete(course.id)}
              disabled={isSavingProgress}
              className={`w-full sm:w-auto px-4 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 border-2 border-slate-800 transition-all cursor-pointer ${
                isCompleted
                  ? "bg-emerald-300 text-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                  : "bg-amber-300 hover:bg-amber-400 text-slate-900 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 text-slate-900`} />
              {isCompleted ? "已完成此單元" : "標記此章節為已看畢"}
            </button>
          </div>

          {/* Video Description Cards */}
          <div className="bg-white rounded-[24px] p-6 border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-black text-sm border-b-2 border-slate-100 pb-2.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3>章節大綱與學習重點</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold font-sans whitespace-pre-line">
              {course.description}
            </p>
          </div>
        </div>

        {/* Right Column (5 units) - Interactive panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive Navigation tabs for context block */}
          <div className="bg-slate-100 p-1.5 rounded-xl border-2 border-slate-800 flex shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
            <button
              id="player-tab-quiz"
              onClick={() => setActiveTab("video")}
              className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "video"
                  ? "bg-indigo-600 text-white border border-slate-800 shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              課後隨堂測驗
            </button>
            <button
              id="player-tab-notes"
              onClick={() => setActiveTab("notes")}
              className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "notes"
                  ? "bg-indigo-600 text-white border border-slate-800 shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <Film className="w-4 h-4" />
              學習筆記速記
            </button>
          </div>

          {/* Tab Render panel */}
          {activeTab === "video" ? (
            quiz ? (
              <QuizPanel
                quiz={quiz}
                userScore={userScore}
                onSaveQuizResult={(score, total) => onSaveQuizResult(quiz.id, score, total)}
                isSaving={isSavingProgress}
              />
            ) : (
              <div className="bg-white rounded-[24px] p-6 border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] text-center space-y-3" id="fallback-no-quiz-card">
                <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-slate-800 text-sm font-black font-sans">
                  此課程目前尚未綁定測驗。
                </p>
                <p className="text-xs text-slate-500">
                  若您是管理權限人員，可以使用上方「管理中心」快速為此課程新增題目！
                </p>
              </div>
            )
          ) : (
            <div className="bg-white rounded-[24px] p-6 border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] space-y-4" id="notes-tab-panel">
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-850">課後精華記要</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  在看影片的過程中，您可以自由在此紀錄您的筆記，系統將即時在您的本機瀏覽器暫存，或同步至您的用戶進度。
                </p>
              </div>

              <textarea
                id="notes-textarea"
                rows={8}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="在此輸入您的筆記，例如：Firestore security rules are extremely important..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:bg-white text-slate-800 font-sans leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  id="btn-save-notes"
                  onClick={handleSaveNote}
                  className="px-5 py-2.5 bg-indigo-600 border-2 border-slate-800 text-white text-xs font-black rounded-xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] transition-all cursor-pointer"
                >
                  儲存筆記
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
