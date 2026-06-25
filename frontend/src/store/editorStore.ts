import { create } from 'zustand';
import * as THREE from 'three';

export type EditorMode = '2d' | '3d';

export interface EditorObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'plane' | 'floor' | 'wall' | 'stair' | 'gltf' | 'obj' | 'group';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  visible: boolean;
  modelUrl?: string;
  isStatic: boolean;
  hp: number;
  speed: number;
  tag: string;
}

interface EditorState {
  mode: EditorMode;
  objects: EditorObject[];
  selectedObjectId: string | null;
  gameName: string;
  gameCode: Record<string, unknown>;
  setMode: (mode: EditorMode) => void;
  addObject: (obj: Omit<EditorObject, 'id'>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  updateObject: (id: string, updates: Partial<EditorObject>) => void;
  toggleVisibility: (id: string) => void;
  moveObjectUp: (id: string) => void;
  moveObjectDown: (id: string) => void;
  duplicateObject: (id: string) => void;
  setGameName: (name: string) => void;
  setGameCode: (code: Record<string, unknown>) => void;
  loadObjects: (objects: EditorObject[]) => void;
  exportCode: () => Record<string, unknown>;
}

let nextId = 1;
const genId = () => `obj_${nextId++}`;

export const useEditorStore = create<EditorState>((set, get) => ({
  mode: '3d',
  objects: [],
  selectedObjectId: null,
  gameName: 'Untitled Game',
  gameCode: {},

  setMode: (mode) => set({ mode }),

  addObject: (obj) => {
    const id = genId();
    set((s) => ({
      objects: [...s.objects, {
        ...obj,
        id,
        isStatic: obj.isStatic ?? true,
        hp: obj.hp ?? 100,
        speed: obj.speed ?? 5,
        tag: obj.tag ?? '',
      }],
      selectedObjectId: id,
    }));
  },

  removeObject: (id) =>
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
    })),

  selectObject: (id) => set({ selectedObjectId: id }),

  updateObject: (id, updates) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  toggleVisibility: (id) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o)),
    })),

  moveObjectUp: (id) =>
    set((s) => {
      const idx = s.objects.findIndex((o) => o.id === id);
      if (idx <= 0) return s;
      const arr = [...s.objects];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return { objects: arr };
    }),

  moveObjectDown: (id) =>
    set((s) => {
      const idx = s.objects.findIndex((o) => o.id === id);
      if (idx < 0 || idx >= s.objects.length - 1) return s;
      const arr = [...s.objects];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { objects: arr };
    }),

  duplicateObject: (id) => {
    const obj = get().objects.find((o) => o.id === id);
    if (!obj) return;
    const newId = genId();
    const dup = {
      ...obj,
      id: newId,
      name: `${obj.name} (copy)`,
      position: [obj.position[0] + 1, obj.position[1], obj.position[2]] as [number, number, number],
    };
    set((s) => ({ objects: [...s.objects, dup], selectedObjectId: newId }));
  },

  setGameName: (name) => set({ gameName: name }),

  setGameCode: (code) => set({ gameCode: code }),

  loadObjects: (objects) => set({ objects, selectedObjectId: null }),

  exportCode: () => {
    const { objects, mode, gameName } = get();
    return {
      name: gameName,
      mode,
      scene: objects.map((o) => ({
        type: o.type,
        name: o.name,
        position: o.position,
        rotation: o.rotation,
        scale: o.scale,
        color: o.color,
        modelUrl: o.modelUrl,
        isStatic: o.isStatic,
        hp: o.hp,
        speed: o.speed,
        tag: o.tag,
      })),
    };
  },
}));
