/**
 * MembersList Component
 * Displays space members with management options
 */

import React from 'react';
import { Crown, Shield, Trash2 } from 'lucide-react';
import { SpaceMember } from '@/domain/models/Space';

interface MembersListProps {
  members: SpaceMember[];
  ownerId: string;
  currentUserId: string;
  canManage: boolean;
  onRemoveMember: (memberId: string, memberUserId: string) => void;
}

export function MembersList({
  members,
  ownerId,
  currentUserId,
  canManage,
  onRemoveMember,
}: MembersListProps) {
  return (
    <div>
      <h3 className="text-sm font-black text-white uppercase font-display mb-3">
        Участники ({members.length})
      </h3>
      <div className="space-y-2">
        {members.map((member) => {
          const isOwner = ownerId === member.userId;
          const isCurrentUser = member.userId === currentUserId;

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 bg-[#150a24] rounded-xl border border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-white font-bold">
                {member.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">
                    {member.displayName}
                    {isCurrentUser && ' (вы)'}
                  </p>
                  {isOwner && <Crown size={14} className="text-accent-orange" />}
                  {member.role === 'admin' && !isOwner && (
                    <Shield size={14} className="text-accent-blue" />
                  )}
                </div>
                <p className="text-xs text-[#8b7ca8]">{member.email}</p>
              </div>
              {!isOwner && !isCurrentUser && canManage && (
                <button
                  onClick={() => onRemoveMember(member.id, member.userId)}
                  className="w-8 h-8 rounded-lg bg-accent-red/10 flex items-center justify-center text-accent-red hover:bg-accent-red/20 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
