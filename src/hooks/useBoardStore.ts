import { useEffect, useRef, useState } from 'react';
import {
  BoardState,
  Space,
  DEFAULT_IMAGES,
  COLORS,
  uid,
} from '@/types/board';

const STORAGE_KEY = 'achievementy_v2_state';

const createInitial = (): BoardState => {
  const space: Space = {
    id: 'sp1',
    name: 'Жизнь',
    color: '#5D82FF',
    achievements: [
      {
        id: 'a1',
        x: 220,
        y: 240,
        title: 'Первый запуск',
        description: 'Открыл приложение и создал первое пространство.',
        image: DEFAULT_IMAGES[1],
        color: '#5D82FF',
      },
      {
        id: 'a2',
        x: 560,
        y: 420,
        title: 'Первая победа',
        description: 'Выполнил первое задание и заполнил рамку.',
        image: DEFAULT_IMAGES[0],
        color: '#F59E0B',
      },
    ],
    tasks: [
      {
        id: 't1',
        x: 260,
        y: 260,
        title: 'Сделать зарядку',
        description: 'Лёгкая разминка по утрам для бодрости.',
        image: DEFAULT_IMAGES[0],
        color: '#2DD4BF',
        stars: 2,
        repeat: 'daily',
        customDays: [],
        active: true,
        done: false,
      },
    ],
    connections: [{ id: 'c1', from: 'a1', to: 'a2' }],
  };

  return {
    spaces: [space],
    activeSpaceId: 'sp1',
    mode: 'tree',
    camera: { x: 0, y: 0, scale: 1 },
  };
};

export const useBoardStore = () => {
  const [state, setState] = useState<BoardState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...createInitial(), ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return createInitial();
  });

  const timer = useRef<number>();
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* ignore */
      }
    }, 300);
  }, [state]);

  return { state, setState };
};

export const newSpace = (index: number): Space => ({
  id: uid(),
  name: `Пространство ${index + 1}`,
  color: COLORS[index % COLORS.length],
  achievements: [],
  tasks: [],
  connections: [],
});
