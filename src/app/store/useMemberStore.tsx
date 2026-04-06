import { create } from "zustand";
import { api } from "../lib/api";
import type { Member } from "../lib/api";

const SELECTED_KEY = "travel:selected_member_id";

interface MemberStore {
  members: Member[];
  selectedMember: Member | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchMembers: () => Promise<void>;
  selectMember: (member: Member) => void;
  addMember: (name: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
}

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: [],
  selectedMember: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const members = await api.listMembers();
      const savedId = localStorage.getItem(SELECTED_KEY);
      const savedMember = members.find((m) => m.id === savedId) ?? members[0] ?? null;
      set({ members, selectedMember: savedMember, isLoading: false });
    } catch (e: any) {
      console.error("fetchMembers:", e);
      set({ error: e.message, isLoading: false });
    }
  },

  selectMember: (member) => {
    localStorage.setItem(SELECTED_KEY, member.id);
    set({ selectedMember: member });
  },

  addMember: async (name) => {
    set({ isSaving: true, error: null });
    try {
      const newMember = await api.createMember(name);
      set((s) => ({
        members: [...s.members, newMember],
        selectedMember: s.selectedMember ?? newMember,
        isSaving: false,
      }));
    } catch (e: any) {
      console.error("addMember:", e);
      set({ error: e.message, isSaving: false });
      throw e;
    }
  },

  removeMember: async (id) => {
    set({ isSaving: true });
    try {
      await api.deleteMember(id);
      set((s) => {
        const members = s.members.filter((m) => m.id !== id);
        const selectedMember =
          s.selectedMember?.id === id
            ? (members[0] ?? null)
            : s.selectedMember;
        if (selectedMember) localStorage.setItem(SELECTED_KEY, selectedMember.id);
        return { members, selectedMember, isSaving: false };
      });
    } catch (e: any) {
      console.error("removeMember:", e);
      set({ isSaving: false });
    }
  },
}));
