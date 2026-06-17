/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Video, Award, X, Save, AlertCircle } from "lucide-react";
import { Course, Quiz, Question } from "../types";

interface AdminPanelProps {
  courses: Course[];
  quizzes: Quiz[];
  onSaveCourse: (course: Course) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onSaveQuiz: (quiz: Quiz) => Promise<void>;
  isSaving: boolean;
}

export default function AdminPanel({
  courses,
  quizzes,
  onSaveCourse,
  onDeleteCourse,
  onSaveQuiz,
  isSaving
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "quizzes">("courses");
  
  // Course form state
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  
  // Quiz editor state
  const [selectedQuizCourseId, setSelectedQuizCourseId] = useState<string>("");
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""]);
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0);
  const [newExplanation, setNewExplanation] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Course management actions
  const handleAddNewCourse = () => {
    setEditingCourse({
      id: "",
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      duration: "",
      category: "Frontend Dev",
      difficulty: "Beginner"
    });
  };

  const handleEditCourseClick = (course: Course) => {
    setEditingCourse({ ...course });
  };

  const handleSaveCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    if (!editingCourse.title || !editingCourse.videoUrl) {
      showNotification("error", "課程名稱與影片網址為必填欄位！");
      return;
    }

    try {
      const updatedCourse: Course = {
        id: editingCourse.id || `course-${Date.now()}`,
        title: editingCourse.title,
        description: editingCourse.description || "學員專屬教學影片",
        videoUrl: editingCourse.videoUrl,
        thumbnailUrl: editingCourse.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=640&auto=format&fit=crop",
        duration: editingCourse.duration || "10:00",
        category: editingCourse.category || "General",
        difficulty: editingCourse.difficulty || "Beginner"
      };

      await onSaveCourse(updatedCourse);
      showNotification("success", "課程影片更新成功！已儲存至雲端。");
      setEditingCourse(null);
    } catch (err) {
      showNotification("error", "存取 Firestore 時發生錯誤，請檢查 Rules 設定。");
    }
  };

  const handleDeleteCourseClick = async (courseId: string) => {
    if (!window.confirm("確定要刪除此課程影片嗎？這將連同進度資訊一併移除。")) return;
    try {
      await onDeleteCourse(courseId);
      showNotification("success", "課程已成功刪除。");
    } catch (err) {
      showNotification("error", "刪除失敗，權限不足或系統錯誤。");
    }
  };

  // Quiz Editor actions
  const handleLoadCourseQuiz = () => {
    if (!selectedQuizCourseId) return;
    const existing = quizzes.find(q => q.courseId === selectedQuizCourseId);
    if (existing) {
      setEditingQuestions([...existing.questions]);
    } else {
      setEditingQuestions([]);
    }
  };

  const handleAddQuestionToTemp = () => {
    if (!newQuestionText) {
      showNotification("error", "請輸入問題題目內容。");
      return;
    }
    if (newOptions.some(opt => !opt.trim())) {
      showNotification("error", "請填寫所有選項答案。");
      return;
    }

    const newQ: Question = {
      id: `q-${Date.now()}`,
      questionText: newQuestionText,
      options: [...newOptions],
      correctIndex: newCorrectIndex,
      explanation: newExplanation
    };

    setEditingQuestions(prev => [...prev, newQ]);
    
    // Reset individual question fields
    setNewQuestionText("");
    setNewOptions(["", "", "", ""]);
    setNewCorrectIndex(0);
    setNewExplanation("");
    showNotification("success", "題目已加入下方暫存清單！別忘了點選底部的「儲存測驗設定」寫入雲端。");
  };

  const handleRemoveQuestionFromTemp = (idx: number) => {
    setEditingQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuizToCloud = async () => {
    if (!selectedQuizCourseId) {
      showNotification("error", "請先選擇欲配對課程！");
      return;
    }

    const courseObj = courses.find(c => c.id === selectedQuizCourseId);
    const quizId = quizzes.find(q => q.courseId === selectedQuizCourseId)?.id || `quiz-${selectedQuizCourseId}`;

    const newQuizObj: Quiz = {
      id: quizId,
      courseId: selectedQuizCourseId,
      title: `${courseObj?.title || '自訂課程'} 隨堂評量`,
      questions: editingQuestions
    };

    try {
      await onSaveQuiz(newQuizObj);
      showNotification("success", "測驗考卷與互動題組已成功儲存至 Firestore！");
    } catch (error) {
      showNotification("error", "儲存測驗至 Firestore 失敗，請確認 Rules 與權限。");
    }
  };

  return (
    <div className="bg-white rounded-[32px] border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_#1e293b] space-y-6" id="admin-management-panel">
      {/* Upper Title and Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-4 border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">後台管理中心 (Admin System)</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">管理雲端 Firestore 影片素材、科目分類與隨堂互動測驗題庫</p>
        </div>

        <div className="flex gap-2.5">
          <button
            id="admin-tab-courses"
            onClick={() => { setActiveTab("courses"); setEditingCourse(null); }}
            className={`px-4 py-2 border-2 border-slate-800 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "courses" 
                ? "bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#1e293b]" 
                : "bg-white text-slate-700 hover:bg-slate-50 shadow-[2px_2px_0px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px]"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            課程影片管理
          </button>
          <button
            id="admin-tab-quizzes"
            onClick={() => { setActiveTab("quizzes"); setEditingCourse(null); }}
            className={`px-4 py-2 border-2 border-slate-800 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "quizzes" 
                ? "bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#1e293b]" 
                : "bg-white text-slate-700 hover:bg-slate-50 shadow-[2px_2px_0px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            測驗題庫管理
          </button>
        </div>
      </div>

      {notification && (
        <div id="admin-notify-banner" className={`p-4 rounded-xl text-xs font-black border-2 border-slate-800 flex items-center gap-2 max-w-2xl shadow-[3px_3px_0px_0px_#1e293b] ${
          notification.type === 'success' ? 'bg-emerald-300 text-slate-900' : 'bg-rose-300 text-slate-900'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Course management tab */}
      {activeTab === "courses" && (
        <div className="space-y-6" id="course-admin-view">
          {!editingCourse ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-sky-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[4px_4px_0px_0px_#1e293b] gap-2">
                <span className="text-xs text-slate-700 font-bold">
                  目前雲端共有 <strong className="text-indigo-600 underline text-sm font-black">{courses.length}</strong> 個影片單元
                </span>
                <button
                  id="btn-admin-add-course"
                  onClick={handleAddNewCourse}
                  className="px-4 py-2 bg-amber-300 text-slate-900 border-2 border-slate-800 rounded-xl text-xs font-black hover:translate-x-[1px] hover:translate-y-[1px] shadow-[3px_3px_0_0_#1e293b] hover:shadow-[2px_2px_0_0_#1e293b] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新增課程影片
                </button>
              </div>

              {/* Table / List representation */}
              <div className="border-4 border-slate-800 rounded-3xl overflow-hidden divide-y-2 divide-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]">
                {courses.length === 0 ? (
                  <div className="p-8 bg-slate-50 text-center text-xs font-bold text-slate-500">
                    暫無課程。請點選上方按鈕新增課程影片。
                  </div>
                ) : (
                  courses.map(c => (
                    <div key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white hover:bg-sky-50 transition-colors gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-[10px] rounded border border-slate-800 font-mono font-black text-indigo-700 uppercase tracking-wide">
                            {c.category}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-slate-800 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                            {c.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 truncate max-w-sm sm:max-w-md">{c.title}</h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm sm:max-w-md font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">{c.videoUrl}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <button
                          id={`btn-edit-course-${c.id}`}
                          onClick={() => handleEditCourseClick(c)}
                          className="p-2 bg-amber-300 text-slate-900 rounded-xl border-2 border-slate-800 hover:translate-x-[1px] hover:translate-y-[1px] shadow-[2px_2px_0px_0px_#1e293b] cursor-pointer transition-all"
                          title="編輯課程"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-course-${c.id}`}
                          onClick={() => handleDeleteCourseClick(c.id)}
                          className="p-2 bg-rose-300 text-slate-900 rounded-xl border-2 border-slate-800 hover:translate-x-[1px] hover:translate-y-[1px] shadow-[2px_2px_0px_0px_#1e293b] cursor-pointer transition-all"
                          title="刪除課程"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Course editing / adding form
            <form onSubmit={handleSaveCourseSubmit} className="bg-sky-50 p-6 rounded-[24px] border-4 border-slate-800 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] space-y-5" id="course-admin-form">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800">{editingCourse.id ? "編輯現有課程" : "新增影片章節"}</h3>
                <button
                  id="btn-close-form"
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="p-1.5 rounded-xl border-2 border-slate-800 hover:bg-slate-200 transition-all cursor-pointer bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="course-title" className="text-[10px] font-black text-slate-850 uppercase tracking-widest">課程名稱 *</label>
                  <input
                    type="text"
                    id="course-title"
                    value={editingCourse.title || ""}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="請輸入教學影片標題"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="course-category" className="text-[10px] font-black text-slate-850 uppercase tracking-widest">學科分類</label>
                  <input
                    type="text"
                    id="course-category"
                    value={editingCourse.category || ""}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="例如：Frontend Dev, CSS Tricks, Database"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="course-videourl" className="text-[10px] font-black text-slate-850 uppercase tracking-widest">YouTube 影片網址 *</label>
                  <input
                    type="text"
                    id="course-videourl"
                    value={editingCourse.videoUrl || ""}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="例如：https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="course-thumbnail" className="text-[10px] font-black text-slate-850 uppercase tracking-widest">封面圖片連結 (Thumbnail Url)</label>
                  <input
                    type="text"
                    id="course-thumbnail"
                    value={editingCourse.thumbnailUrl || ""}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="留空將自動帶入預設程式設計意境圖"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="course-duration" className="text-[10px] font-black text-slate-850 uppercase tracking-widest">影片時長</label>
                  <input
                    type="text"
                    id="course-duration"
                    value={editingCourse.duration || ""}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="例如：12:45"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="course-difficulty" className="text-[10px] font-black text-slate-850 uppercase tracking-widest">難易度</label>
                  <select
                    id="course-difficulty"
                    value={editingCourse.difficulty || "Beginner"}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:bg-slate-50 cursor-pointer"
                  >
                    <option value="Beginner">Beginner (基礎)</option>
                    <option value="Intermediate">Intermediate (中階)</option>
                    <option value="Advanced">Advanced (進階)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="course-description" className="text-[10px] font-black text-slate-850 uppercase tracking-widest">課程學習重點大綱</label>
                <textarea
                  id="course-description"
                  rows={4}
                  value={editingCourse.description || ""}
                  onChange={(e) => setEditingCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="請在此輸入學習指南與精華要點大綱..."
                  className="w-full p-3 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  id="btn-cancel-course"
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 bg-white text-slate-700 border-2 border-slate-800 rounded-xl text-xs font-black shadow-[3px_3px_0px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1e293b] transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  id="btn-save-course-submit"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1e293b] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "正在儲存中..." : "確認儲存影片"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Quiz management tab */}
      {activeTab === "quizzes" && (
        <div className="space-y-6" id="quiz-admin-view">
          {/* Pick Course matching section */}
          <div className="bg-amber-100 p-5 rounded-[24px] border-4 border-slate-800 shadow-[4px_4px_0_0_#1e293b] flex flex-col sm:flex-row items-end gap-3 justify-between">
            <div className="space-y-2 flex-1 w-full">
              <label htmlFor="admin-quiz-course-select" className="text-xs font-black text-slate-850 uppercase tracking-wider">步驟 1：選擇要配對互動考卷的課程</label>
              <select
                id="admin-quiz-course-select"
                value={selectedQuizCourseId}
                onChange={(e) => {
                  setSelectedQuizCourseId(e.target.value);
                  setEditingQuestions([]);
                }}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-black text-slate-800 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none"
              >
                <option value="">-- 請選擇影片 --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <button
              id="btn-load-quiz"
              disabled={!selectedQuizCourseId}
              onClick={handleLoadCourseQuiz}
              className="px-5 py-2.5 bg-slate-850 disabled:bg-slate-200 disabled:text-slate-405 disabled:border-slate-300 disabled:shadow-none hover:bg-slate-900 text-white rounded-xl text-xs font-black border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] transition-all cursor-pointer whitespace-nowrap"
            >
              加載現有考卷
            </button>
          </div>

          {selectedQuizCourseId && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              
              {/* Question Editor Grid Left (5 columns) */}
              <div className="lg:col-span-5 bg-sky-50 p-5 rounded-[24px] border-4 border-slate-800 shadow-[6px_6px_0_0_#1e293b] space-y-4">
                <h3 className="text-sm font-black text-slate-805 border-b-2 border-slate-800 pb-2.5 flex items-center gap-1.5 font-sans">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  新增多選題
                </h3>

                <div className="space-y-1.5">
                  <label htmlFor="admin-q-text" className="text-[10px] font-black text-slate-800 uppercase tracking-wider">1. 問題題目</label>
                  <input
                    type="text"
                    id="admin-q-text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="請輸入完整的觀念考題..."
                    className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-850 shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none"
                  />
                </div>

                {/* Multiple Options config */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">2. 四個候選選項與正確答案</span>
                  {newOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctIndexGroup"
                        checked={newCorrectIndex === i}
                        onChange={() => setNewCorrectIndex(i)}
                        className="text-indigo-600 focus:ring-slate-800 w-4 h-4 shrink-0 border-2 border-slate-800 cursor-pointer"
                        title="設此為正確答案"
                        aria-label={`設選項 ${i + 1} 為正確答案`}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[i] = e.target.value;
                          setNewOptions(updated);
                        }}
                        placeholder={`選項 ${String.fromCharCode(65 + i)}`}
                        className="w-full px-2 py-1.5 bg-white border-2 border-slate-800 rounded-lg text-xs font-bold"
                      />
                    </div>
                  ))}
                  <span className="text-[10px] text-slate-550 block font-bold mt-1">💡 點選左側圓圈，指定對應為正確解答。</span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-q-explanation" className="text-[10px] font-black text-slate-800 uppercase tracking-wider">3. 精華詳解說明 (解析)</label>
                  <textarea
                    id="admin-q-explanation"
                    rows={3}
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder="點選答案後會對學員顯示的學習原理與說明..."
                    className="w-full p-2.5 bg-white border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-800 shadow-[2px_2px_0px_0px_#1e293b]"
                  />
                </div>

                <button
                  id="btn-temp-add-question"
                  onClick={handleAddQuestionToTemp}
                  className="w-full py-2.5 bg-amber-300 hover:bg-amber-405 text-slate-900 rounded-xl text-xs font-black border-2 border-slate-800 shadow-[3px_3px_0_0_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#1e293b] transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加此題目至預覽試卷
                </button>
              </div>

              {/* Question List Preview Right (7 columns) */}
              <div className="lg:col-span-7 bg-white border-4 border-slate-800 p-5 rounded-[24px] shadow-[6px_6px_0_0_#1e293b] space-y-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center justify-between border-b-2 border-slate-150 pb-2">
                  <span>考卷預覽 ＆ 題目列 ({editingQuestions.length} 題)</span>
                  {editingQuestions.length > 0 && (
                    <span className="text-[10px] text-indigo-900 bg-amber-300 border-2 border-slate-800 px-3 py-0.5 rounded-full font-black animate-pulse">
                      有變更未儲存
                    </span>
                  )}
                </h3>

                {editingQuestions.length === 0 ? (
                  <div className="p-8 border-4 border-dashed border-slate-200 bg-slate-50 rounded-2xl text-center text-slate-500 font-bold text-xs leading-relaxed">
                    試卷目前無題目。請在左側填寫題目並點選「添加題目」建立內容。
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {editingQuestions.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="bg-amber-50 rounded-xl p-4 border-2 border-slate-800 shadow-[3px_3px_0_0_#1e293b] space-y-2.5 text-xs relative pr-12">
                        <h4 className="font-extrabold text-slate-850 text-sm">
                          {qIdx + 1}. {q.questionText}
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-705">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`px-2 py-1.5 rounded-md flex items-center gap-1.5 ${
                              oIdx === q.correctIndex 
                                ? 'bg-emerald-300 border-2 border-slate-800 text-slate-900 font-extrabold shadow-[1px_1px_0_0_#1e293b]' 
                                : 'bg-white border border-slate-300 font-bold'
                            }`}>
                              <span className="font-mono">{String.fromCharCode(65 + oIdx)}.</span>
                              <span className="truncate">{opt}</span>
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <p className="text-[10.5px] text-indigo-800 font-bold bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                            💡 解析: {q.explanation}
                          </p>
                        )}

                        <button
                          id={`btn-remove-question-${qIdx}`}
                          type="button"
                          onClick={() => handleRemoveQuestionFromTemp(qIdx)}
                          className="absolute right-3 top-3 p-1.5 bg-rose-300 text-slate-900 rounded-lg border-2 border-slate-800 hover:translate-x-[1px] hover:translate-y-[1px] shadow-[2px_2px_0_0_#1e293b] hover:shadow-none transition-all cursor-pointer"
                          title="刪除題目"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirm Save with Cloud database */}
                <div className="pt-4 border-t-2 border-slate-150 flex justify-end">
                  <button
                    id="btn-save-quiz-cloud"
                    onClick={handleSaveQuizToCloud}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-405 disabled:border-slate-300 disabled:shadow-none text-white text-xs font-black rounded-xl border-2 border-slate-800 shadow-[4px_4px_0px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#1e293b] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "正在同步寫入雲端..." : `確認並儲存試卷 (${editingQuestions.length} 題)`}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
