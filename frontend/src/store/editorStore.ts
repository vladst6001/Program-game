import { create } from 'zustand';

export type EditorMode = '2d' | '3d';
export type ToolMode = 'translate' | 'rotate' | 'scale';
export type ObjectRole = 'player' | 'npc' | 'object' | 'camera';

export interface EditorObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'plane' | 'floor' | 'wall' | 'stair' | 'camera' | 'gltf' | 'obj' | 'group';
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
  role: ObjectRole;
}

interface EditorState {
  mode: EditorMode;
  toolMode: ToolMode;
  objects: EditorObject[];
  selectedObjectId: string | null;
  gameName: string;
  gameCode: Record<string, unknown>;
  setMode: (mode: EditorMode) => void;
  setToolMode: (mode: ToolMode) => void;
  addObject: (obj: Omit<EditorObject, 'id'>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  updateObject: (id: string, updates: Partial<EditorObject>) => void;
  toggleVisibility: (id: string) => void;
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
  toolMode: 'translate',
  objects: [],
  selectedObjectId: null,
  gameName: 'Новая игра',
  gameCode: {},

  setMode: (mode) => set({ mode }),
  setToolMode: (toolMode) => set({ toolMode }),

  addObject: (obj) => {
    const id = genId();
    set((s) => ({ objects: [...s.objects, { ...obj, id }], selectedObjectId: id }));
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

  duplicateObject: (id) => {
    const obj = get().objects.find((o) => o.id === id);
    if (!obj) return;
    const newId = genId();
    set((s) => ({
      objects: [...s.objects, { ...obj, id: newId, name: `${obj.name} (копия)`, role: 'object' as ObjectRole }],
      selectedObjectId: newId,
    }));
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
        isStatic: o.isStatic,
        hp: o.hp,
        speed: o.speed,
        tag: o.tag,
        role: o.role,
      })),
    };
  },
}));
