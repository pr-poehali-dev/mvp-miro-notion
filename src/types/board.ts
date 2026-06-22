export type Mode = 'tree' | 'tasks';

export type Repeat = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Achievement {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  image: string;
  color: string;
  done?: boolean;
  cropX?: number;
  cropY?: number;
  cropScale?: number;
  isBoss?: boolean;
}

export interface Task {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  image: string;
  color: string;
  stars: number;
  repeat: Repeat;
  customDays: number[];
  active: boolean;
  done: boolean;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  achievements: Achievement[];
  tasks: Task[];
  connections: Connection[];
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface BoardState {
  spaces: Space[];
  activeSpaceId: string;
  mode: Mode;
  camera: Camera;
}

export const COLORS = [
  '#5D82FF',
  '#2DD4BF',
  '#F59E0B',
  '#A855F7',
  '#EF4444',
  '#EC4899',
  '#84CC16',
];

export const REPEAT_LABELS: Record<Repeat, string> = {
  once: 'Одноразовое',
  daily: 'Ежедневное',
  weekly: 'Еженедельное',
  monthly: 'Ежемесячное',
  custom: 'По дням недели',
};

export const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DEFAULT_IMAGES = [
  'https://cdn.poehali.dev/projects/fa7ec7c5-a682-4b0a-b13f-98143bf9ba6c/files/5692577d-007a-4089-a42c-9c02db97cff7.jpg',
  'https://cdn.poehali.dev/projects/fa7ec7c5-a682-4b0a-b13f-98143bf9ba6c/files/c37d41f8-bbfd-4c6a-b338-784e1d5c7fbd.jpg',
];

export const uid = () => Math.random().toString(36).slice(2, 9);