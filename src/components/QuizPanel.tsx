/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Award, Check, X, HelpCircle } from "lucide-react";
import { Quiz, Question } from "../types";

interface QuizPanelProps {
  quiz: Quiz;
  userScore: { score: number; total: number } | null;
  onSaveQuizResult: (score: number, total: number) => void;
  isSaving: boolean;
}

export default function QuizPanel({
  quiz,
  userScore,
  onSaveQuizResult,
  isSaving
}: QuizPanelProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = quiz.questions;
  const currentQuestion: Question | undefined = questions[currentIdx];

  // Run on answer selection
  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedOpt(index);
  };

  // Submit Answer & Verify Choice
  const handleSubmitAnswer = () => {
    if (selectedOpt === null || isSubmitted) return;
    
    setIsSubmitted(true);
    if (currentQuestion && selectedOpt === currentQuestion.correctIndex) {
      setCorrectCount(prev => prev + 1);
    }
  };

  // Go to next step
  const handleNextStep = () => {
    setSelectedOpt(null);
    setIsSubmitted(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Quiz completed! Save result
      setIsFinished(true);
      onSaveQuizResult(correctCount, questions.length);
    }
  };

  // Restart Quiz
  const handleRestartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsSubmitted(false);
    setCorrectCount(0);
    setIsFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-[24px] border-4 border-slate-800 text-center" id="no-quiz-warning">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-bounce" />
        <p className="text-slate-800 text-sm font-black">本課程目前尚未配置隨堂互動測驗。</p>
      </div>
    );
  }

  // Finished state inside taking the quiz (or showing the historical quiz score)
  if (isFinished || (userScore && !isFinished && currentIdx === 0 && selectedOpt === null)) {
    const finalScore = isFinished ? correctCount : (userScore?.score ?? 0);
    const finalTotal = isFinished ? questions.length : (userScore?.total ?? 1);
    const percentage = Math.round((finalScore / finalTotal) * 100);
    const passed = percentage >= 60;

    return (
      <div className="bg-white rounded-[32px] p-6 border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] text-center space-y-6" id="quiz-result-card">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-300 border-2 border-slate-800 shadow-[3px_3px_0px_0px_#1e293b] text-slate-900 mb-2">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h4 className="text-lg font-black text-slate-800">{quiz.title}</h4>
          <p className="text-xs text-slate-500 font-bold">系統互動隨堂測驗分數結算</p>
        </div>

        {/* Circular / Large Score Counter - Neobrutalist score board */}
        <div className="bg-indigo-50 border-4 border-slate-800 rounded-[24px] p-6 max-w-xs mx-auto shadow-[4px_4px_0_0_#1e293b] inline-block px-10">
          <div className="text-4xl font-mono font-black text-indigo-900">
            {finalScore} <span className="text-slate-400 font-normal">/</span> {finalTotal}
          </div>
          <div className="text-xs text-slate-500 font-bold mt-1.5">答對率 {percentage}%</div>
        </div>

        {/* Performance banner with vibrant colors according to pass status */}
        <div className={`p-4 rounded-xl text-xs font-black border-2 border-slate-800 flex items-center justify-center gap-2 max-w-sm mx-auto shadow-[2px_2px_0_0_#1e293b] ${
          passed ? "bg-emerald-300 text-slate-900" : "bg-rose-300 text-slate-900"
        }`}>
          {passed ? (
            <>
              <Check2 className="w-4 h-4 text-slate-900" />
              <span>通過標準！觀念掌握良好，繼續保持！</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-slate-900" />
              <span>未達 60% 標準。建議重新觀看並複習！</span>
            </>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="quiz-btn-restart"
            onClick={handleRestartQuiz}
            className="px-5 py-2.5 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-xl border-2 border-slate-800 shadow-[4px_4px_0px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#1e293b] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            重新挑戰測驗
          </button>
        </div>
      </div>
    );
  }

  // Active taking quiz view
  return (
    <div className="bg-white rounded-[24px] p-6 border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] flex flex-col justify-between min-h-[400px]" id="quiz-question-container">
      {/* Header index status */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-black font-mono tracking-wider uppercase">
          <span>{quiz.title}</span>
          <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">問題: {currentIdx + 1} / {questions.length}</span>
        </div>

        {/* Progress horizontal steps bar - Neobrutalist chunky style */}
        <div className="w-full bg-slate-100 border-2 border-slate-800 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-amber-400 h-full border-r-2 border-slate-800 transition-all duration-300" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main question box */}
      <div className="my-6 space-y-4">
        <h4 className="text-base font-black text-slate-850 leading-snug font-sans" id={`question-text-${currentIdx}`}>
          {currentQuestion?.questionText}
        </h4>

        {/* Options list */}
        <div className="space-y-3">
          {currentQuestion?.options.map((option, termIdx) => {
            const isSelected = selectedOptTermIdxMatch(termIdx);
            const optionClass = getOptionStyling(termIdx);

            return (
              <button
                id={`option-btn-${termIdx}`}
                key={termIdx}
                disabled={isSubmitted}
                onClick={() => handleSelectOption(termIdx)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 border-slate-800 text-xs font-bold leading-relaxed transition-all flex items-start gap-3 cursor-pointer shadow-[3px_3px_0px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:pointer-events-none ${optionClass}`}
              >
                <span className={`w-6 h-6 rounded-lg border-2 border-slate-800 flex items-center justify-center shrink-0 font-black font-mono text-[11px] ${
                  isSelected ? "bg-amber-400 text-slate-900 shadow-[1px_1px_0_0_#1e293b]" : "bg-white text-slate-700"
                }`}>
                  {String.fromCharCode(65 + termIdx)}
                </span>
                <span className="font-bold flex-1 pt-0.5">{option}</span>
                {isSubmitted && termIdx === currentQuestion.correctIndex && (
                  <Check className="w-5 h-5 text-emerald-800 shrink-0" />
                )}
                {isSubmitted && isSelected && termIdx !== currentQuestion.correctIndex && (
                   <X className="w-5 h-5 text-rose-800 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer and Explanations */}
      <div className="space-y-4 pt-4 border-t-2 border-slate-100">
        {isSubmitted && currentQuestion && (
          <div className="bg-indigo-50 rounded-2xl p-4 border-2 border-slate-800 shadow-[3px_3px_0_0_#1e293b] space-y-1.5" id="quiz-explanation">
            <div className="text-xs font-black text-indigo-900 flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              觀念解析指南：
            </div>
            <p className="text-xs text-slate-700 font-bold leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          {!isSubmitted ? (
            <button
              id="quiz-btn-submit"
              disabled={selectedOpt === null}
              onClick={handleSubmitAnswer}
              className={`px-5 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedOpt === null
                  ? "bg-slate-200 text-slate-400 border-2 border-slate-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-800 shadow-[3px_3px_0px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1e293b]"
              }`}
            >
              確認答案 / Submit
            </button>
          ) : (
            <button
              id="quiz-btn-next"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-xl border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              {currentIdx + 1 < questions.length ? "下一題" : "觀看分數結算"}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Checks options selection state matches
  function selectedOptTermIdxMatch(idx: number) {
    return selectedOpt === idx;
  }

  // Returns CSS visual feedback classes for MCQ answers
  function getOptionStyling(termIdx: number): string {
    const isSelected = selectedOpt === termIdx;
    if (!isSubmitted) {
      return isSelected 
        ? "bg-amber-300 text-slate-900" 
        : "bg-white text-slate-800 hover:bg-slate-50";
    }

    // After answer submission styling logic
    if (termIdx === currentQuestion?.correctIndex) {
      return "bg-emerald-300 text-slate-900 border-emerald-800";
    }
    if (isSelected && termIdx !== currentQuestion?.correctIndex) {
      return "bg-rose-300 text-slate-900 border-rose-800";
    }
    return "bg-slate-50 text-slate-400 opacity-60 shadow-none";
  }
}

// Simple Helper Check Icon component
function Check2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
