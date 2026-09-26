import { createContext, createElement, useContext, useState } from 'react';

const STORAGE_KEY = 'goal';
const DEFAULT_GOAL = { price: 5000, sodium: 670, kcal: 700 };

function readGoal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
}

const GoalContext = createContext(null);

export function GoalProvider({ children }) {
  const [goal, setGoalState] = useState(readGoal);

  const setGoal = (next) => {
    setGoalState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const resetGoal = () => setGoal(DEFAULT_GOAL);

  // .js 확장자라 JSX 대신 createElement를 씁니다 (빌드 시 JSX 파싱 에러 방지).
  return createElement(GoalContext.Provider, { value: { goal, setGoal, resetGoal } }, children);
}

export function useGoal() {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoal은 GoalProvider 안에서만 쓸 수 있어요.');
  return ctx;
}
