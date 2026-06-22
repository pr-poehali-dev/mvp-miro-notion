export interface Achievement {
  id: string;
  x: number;
  y: number;
  title: string;
  image: string;
  color: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface BoardState {
  achievements: Achievement[];
  connections: Connection[];
}

export const COLORS = [
  '#2DD4BF',
  '#F59E0B',
  '#A855F7',
  '#EF4444',
  '#3B82F6',
  '#EC4899',
  '#84CC16',
];

export const DEFAULT_IMAGES = [
  'https://cdn.poehali.dev/projects/fa7ec7c5-a682-4b0a-b13f-98143bf9ba6c/files/5692577d-007a-4089-a42c-9c02db97cff7.jpg',
  'https://cdn.poehali.dev/projects/fa7ec7c5-a682-4b0a-b13f-98143bf9ba6c/files/c37d41f8-bbfd-4c6a-b338-784e1d5c7fbd.jpg',
];
