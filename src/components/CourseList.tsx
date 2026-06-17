/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Search, Film, CheckCircle2, Award, Play } from "lucide-react";
import { Course } from "../types";

interface CourseListProps {
  courses: Course[];
  completedVideos: string[];
  quizScores: { [quizId: string]: { score: number; total: number } };
  activeCourseId: string | null;
  onSelectCourse: (id: string) => void;
}

export default function CourseList({
  courses,
  completedVideos,
  quizScores,
  activeCourseId,
  onSelectCourse
}: CourseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Filter lists dynamically
  const categories = ["All", ...Array.from(new Set(courses.map(c => c.category)))];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = selectedDifficulty === "All" || course.difficulty === selectedDifficulty;
    const matchesCat = selectedCategory === "All" || course.category === selectedCategory;

    return matchesSearch && matchesDiff && matchesCat;
  });

  return (
    <div className="space-y-8" id="course-list-panel">
      {/* Search and Filters Strip - Vibrant Neobrutalist design */}
      <div className="bg-white rounded-3xl p-6 border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            id="course-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋課程名稱、關鍵字或描述..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-800 rounded-xl text-sm font-bold tracking-tight focus:outline-none focus:bg-white text-slate-800 transition-all font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-amber-300 border-2 border-slate-800 rounded-xl text-xs font-black text-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] focus:outline-none cursor-pointer"
          >
            <option value="All">所有分類 / Categories</option>
            {categories.filter(c => c !== "All").map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            id="filter-difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-3 bg-indigo-50 border-2 border-slate-800 rounded-xl text-xs font-black text-slate-850 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] focus:outline-none cursor-pointer"
          >
            <option value="All">難易度 - 全部</option>
            {difficulties.filter(d => d !== "All").map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Courses */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[32px] border-4 border-dashed border-slate-400 p-8" id="empty-courses-fallback">
          <Film className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-850 text-lg font-black font-sans mb-1">找不到符合篩選條件的課程影片</p>
          <p className="text-slate-500 text-sm">請嘗試調整您的關鍵字或分類篩選</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="courses-grid">
          {filteredCourses.map((course) => {
            const isCompleted = completedVideos.includes(course.id);
            const isActive = activeCourseId === course.id;
            
            // Checking if quiz for this course is solved
            const quizSolved = Object.keys(quizScores).some(qId => qId.includes(course.id) || qId === `quiz_${course.id}`);
            const scoreDetails = Object.entries(quizScores).find(([qId]) => qId.includes(course.id) || qId === `quiz_${course.id}`)?.[1];

            return (
              <div
                id={`course-card-${course.id}`}
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={`group cursor-pointer bg-white rounded-[24px] border-4 border-slate-800 transition-all overflow-hidden relative flex flex-col h-full shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] ${
                  isActive ? "ring-4 ring-indigo-600/40" : ""
                }`}
              >
                {/* Thumbnail Layer */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border-b-4 border-slate-800">
                  <img
                    src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=640&auto=format&fit=crop"}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  
                  {/* Overlay tags */}
                  <div className="absolute inset-x-2 bottom-2 flex justify-between items-center z-10">
                    <span className="px-2.5 py-1 bg-slate-900/95 text-[10px] text-white rounded-lg font-mono font-bold tracking-wider uppercase border border-slate-800 shadow-[1px_1px_0px_0px_#1e293b]">
                      {course.duration}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] rounded-lg font-black text-white border border-slate-800 shadow-[1px_1px_0px_0px_#1e293b] ${
                      course.difficulty === 'Beginner' ? 'bg-emerald-500' :
                      course.difficulty === 'Intermediate' ? 'bg-indigo-600' : 'bg-rose-500'
                    }`}>
                      {course.difficulty}
                    </span>
                  </div>

                  {/* Play Hover Button */}
                  <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-slate-950/30 flex items-center justify-center transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-300 border-2 border-slate-800 flex items-center justify-center text-slate-900 scale-90 group-hover:scale-100 transition-all opacity-0 group-hover:opacity-100 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-indigo-600 font-black tracking-widest">
                      <span className="uppercase font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{course.category}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Badges / Metrics at the Bottom */}
                  <div className="border-t-2 border-slate-100 mt-5 pt-4 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 py-1 px-2 rounded-lg bg-emerald-50 border-2 border-emerald-300 font-bold text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已看畢
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">尚未觀看</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {quizSolved && scoreDetails ? (
                        <span className="flex items-center gap-1 text-slate-900 bg-amber-300 border-2 border-slate-800 px-2.5 py-1 rounded-xl font-bold font-mono text-[11px] shadow-[2px_2px_0px_0px_#1e293b]">
                          <Award className="w-3.5 h-3.5 text-slate-900" />
                          測驗: {scoreDetails.score}/{scoreDetails.total}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-medium">無測驗紀錄</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
