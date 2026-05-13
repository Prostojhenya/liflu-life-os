/**
 * SpaceList Component
 * Displays list of user's spaces
 */

import React from 'react';
import { Users, Lock, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Space } from '@/domain/models/Space';

interface SpaceListProps {
  spaces: Space[];
  currentSpaceId: string | null;
  userId: string;
  onSwitchSpace: (spaceId: string) => void;
  onManageSpace: (spaceId: string, spaceName: string) => void;
  onDeleteSpace: (spaceId: string) => void;
}

export function SpaceList({
  spaces,
  currentSpaceId,
  userId,
  onSwitchSpace,
  onManageSpace,
  onDeleteSpace,
}: SpaceListProps) {
  return (
    <div className="space-y-3">
      {spaces.map((space) => {
        const isActive = space.id === currentSpaceId;
        const isOwner = space.ownerId === userId;

        return (
          <div
            key={space.id}
            className={cn(
              "p-4 rounded-2xl border-2 transition-all",
              isActive
                ? "bg-accent-purple/20 border-accent-purple"
                : "bg-[#150a24] border-white/10"
            )}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSwitchSpace(space.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isActive ? "bg-accent-purple" : "bg-white/5"
                  )}
                >
                  {space.type === 'shared' ? (
                    <Users size={20} className={isActive ? "text-white" : "text-[#8b7ca8]"} />
                  ) : (
                    <Lock size={20} className={isActive ? "text-white" : "text-[#8b7ca8]"} />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-sm font-black uppercase font-display",
                      isActive ? "text-white" : "text-[#8b7ca8]"
                    )}
                  >
                    {space.name}
                  </h3>
                  <p className="text-[10px] text-[#8b7ca8] font-display">
                    {space.type === 'shared'
                      ? `${space.memberCount || 1} участников`
                      : 'Личное'}
                  </p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-accent-purple" />
                )}
              </button>

              {space.type === 'shared' && isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageSpace(space.id, space.name);
                  }}
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8] hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <Settings size={16} />
                </button>
              )}

              {isOwner && !isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSpace(space.id);
                  }}
                  className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
