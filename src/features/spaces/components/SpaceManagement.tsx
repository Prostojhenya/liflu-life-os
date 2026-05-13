/**
 * SpaceManagement Component
 * Manages space settings, members, and invites
 */

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Space, SpaceMember } from '@/domain/models/Space';
import { MembersList } from './MembersList';
import { InviteMemberForm } from './InviteMemberForm';

interface SpaceManagementProps {
  space: Space;
  members: SpaceMember[];
  currentUserId: string;
  canManage: boolean;
  onRenameSpace: (newName: string) => Promise<void>;
  onDeleteSpace: () => Promise<void>;
  onRemoveMember: (memberId: string, memberUserId: string) => void;
  onInviteByEmail: (email: string) => Promise<void>;
  onGenerateInviteLink: () => Promise<string>;
}

export function SpaceManagement({
  space,
  members,
  currentUserId,
  canManage,
  onRenameSpace,
  onDeleteSpace,
  onRemoveMember,
  onInviteByEmail,
  onGenerateInviteLink,
}: SpaceManagementProps) {
  const [editingName, setEditingName] = useState(space.name);
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!editingName.trim() || isSavingName || editingName.trim() === space.name) return;

    setIsSavingName(true);
    try {
      await onRenameSpace(editingName.trim());
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Rename Space */}
      {canManage && (
        <div className="flex gap-2">
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            placeholder="Название пространства..."
            className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all uppercase"
            disabled={isSavingName}
          />
          <button
            onClick={handleSaveName}
            disabled={!editingName.trim() || isSavingName || editingName.trim() === space.name}
            className="px-4 h-10 bg-accent-purple text-white rounded-xl text-xs font-black uppercase font-display disabled:opacity-40 active:scale-95 transition-all"
          >
            {isSavingName ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Сохранить'
            )}
          </button>
        </div>
      )}

      {/* Members List */}
      <MembersList
        members={members}
        ownerId={space.ownerId}
        currentUserId={currentUserId}
        canManage={canManage}
        onRemoveMember={onRemoveMember}
      />

      {/* Invite Form */}
      {canManage && (
        <InviteMemberForm
          onInviteByEmail={onInviteByEmail}
          onGenerateLink={onGenerateInviteLink}
        />
      )}

      {/* Delete Space Button */}
      {space.ownerId === currentUserId && space.type === 'shared' && (
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={onDeleteSpace}
            className="w-full py-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-accent-red/20 transition-all"
          >
            <Trash2 size={16} />
            Удалить пространство
          </button>
        </div>
      )}
    </div>
  );
}
