/**
 * InvitesList Component
 * Displays pending invites for the user
 */

import React from 'react';
import { Mail } from 'lucide-react';
import { SpaceInvite } from '@/domain/models/Space';

interface InvitesListProps {
  invites: SpaceInvite[];
  onAcceptInvite: (invite: SpaceInvite) => Promise<void>;
  onRejectInvite: (inviteId: string) => Promise<void>;
}

export function InvitesList({ invites, onAcceptInvite, onRejectInvite }: InvitesListProps) {
  if (invites.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-accent-purple/10 border border-accent-purple/30 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Mail size={16} className="text-accent-purple" />
        <h3 className="text-sm font-black text-white uppercase font-display">
          Приглашения ({invites.length})
        </h3>
      </div>
      <div className="space-y-2">
        {invites.map((invite) => (
          <div key={invite.id} className="bg-[#0b0416] rounded-xl p-3">
            <p className="text-sm font-bold text-white mb-1">{invite.spaceName}</p>
            <p className="text-xs text-[#8b7ca8] mb-3">
              Приглашение в групповое пространство
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onAcceptInvite(invite)}
                className="flex-1 bg-accent-purple text-white py-2 rounded-lg text-xs font-bold uppercase hover:bg-accent-purple/90 transition-colors"
              >
                Принять
              </button>
              <button
                onClick={() => onRejectInvite(invite.id)}
                className="flex-1 bg-white/5 text-[#8b7ca8] py-2 rounded-lg text-xs font-bold uppercase hover:bg-white/10 transition-colors"
              >
                Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
