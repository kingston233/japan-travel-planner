import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  UserPlus,
  Trash2,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { useMemberStore } from "../store/useMemberStore";
import type { Member } from "../lib/api";

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MemberAvatar({
  member,
  size = "md",
}: {
  member: Member;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };
  const initials = member.name.slice(0, 1);
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}
      style={{ backgroundColor: member.avatarColor }}
    >
      {initials}
    </div>
  );
}

// ─── MemberSwitcher ───────────────────────────────────────────────────────────

export function MemberSwitcher() {
  const {
    members,
    selectedMember,
    isLoading,
    isSaving,
    fetchMembers,
    selectMember,
    addMember,
    removeMember,
  } = useMemberStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load members on mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
        setNewName("");
        setAddError("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when add form shows
  useEffect(() => {
    if (showAddForm) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showAddForm]);

  const handleSelect = (member: Member) => {
    selectMember(member);
    setIsOpen(false);
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError("請輸入姓名");
      return;
    }
    if (members.some((m) => m.name === trimmed)) {
      setAddError("此姓名已存在");
      return;
    }
    try {
      await addMember(trimmed);
      setNewName("");
      setShowAddForm(false);
      setAddError("");
    } catch {
      setAddError("新增失敗，請稍後再試");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setShowAddForm(false);
      setNewName("");
      setAddError("");
    }
  };

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (members.length <= 1) return; // prevent removing last member
    await removeMember(id);
  };

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all
          ${isOpen
            ? "bg-blue-50 border-blue-200 shadow-sm"
            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
      >
        {isLoading ? (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          </div>
        ) : selectedMember ? (
          <MemberAvatar member={selectedMember} size="sm" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}

        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] text-gray-400 font-medium">目前身分</span>
          <span className="text-xs font-semibold text-gray-800 mt-0.5">
            {isLoading ? "載入中…" : (selectedMember?.name ?? "選擇成員")}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ml-0.5 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-800">旅遊成員</span>
              <span className="ml-auto text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                {members.length} 人
              </span>
            </div>
          </div>

          {/* Member list */}
          <div className="max-h-56 overflow-y-auto py-1.5">
            {members.length === 0 && !isLoading && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                尚無成員
              </div>
            )}
            {members.map((member) => {
              const isSelected = selectedMember?.id === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group
                    ${isSelected
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                    }`}
                >
                  <MemberAvatar member={member} size="sm" />

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-blue-700" : "text-gray-800"
                      }`}
                    >
                      {member.name}
                    </p>
                  </div>

                  {/* Right: check or delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                    {!isSelected && members.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => handleRemove(e, member.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                        title="移除成員"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Add member section */}
          {showAddForm ? (
            <div className="px-3 py-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 px-1">新增成員姓名</p>
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setAddError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="輸入姓名…"
                maxLength={20}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              {addError && (
                <p className="text-xs text-red-500 px-1">{addError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={isSaving || !newName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  確認新增
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewName("");
                    setAddError("");
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="font-medium">新增成員</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}