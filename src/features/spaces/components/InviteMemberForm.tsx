/**
 * InviteMemberForm Component
 * Form for inviting members via email or link
 */

import React, { useState } from 'react';
import { Mail, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteMemberFormProps {
  onInviteByEmail: (email: string) => Promise<void>;
  onGenerateLink: () => Promise<string>;
}

export function InviteMemberForm({ onInviteByEmail, onGenerateLink }: InviteMemberFormProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || isSendingInvite) return;

    setIsSendingInvite(true);
    try {
      await onInviteByEmail(inviteEmail.trim());
      setInviteEmail('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleGenerateLink = async () => {
    if (isGeneratingLink) return;

    setIsGeneratingLink(true);
    try {
      const link = await onGenerateLink();
      setInviteLink(link);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="pt-4 border-t border-white/10 space-y-3">
      <h3 className="text-sm font-black text-white uppercase font-display">
        Пригласить участника
      </h3>

      {/* Email invite */}
      <div className="flex gap-2">
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInviteByEmail()}
          placeholder="Email участника..."
          className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
          disabled={isSendingInvite}
        />
        <button
          onClick={handleInviteByEmail}
          disabled={!inviteEmail.trim() || isSendingInvite}
          className="w-12 h-12 bg-accent-purple text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-50"
        >
          {isSendingInvite ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Mail size={20} />
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display">
          или
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Link invite */}
      {!inviteLink ? (
        <button
          onClick={handleGenerateLink}
          disabled={isGeneratingLink}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[#8b7ca8] font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          {isGeneratingLink ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LinkIcon size={16} />
          )}
          Создать ссылку-приглашение
        </button>
      ) : (
        <div className="bg-[#150a24] border border-accent-purple/30 rounded-xl p-3">
          <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display mb-2">
            Ссылка действительна 7 дней
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/30 rounded-lg px-3 py-2 text-xs text-[#8b7ca8] font-mono truncate">
              {inviteLink}
            </div>
            <button
              onClick={handleCopyLink}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                linkCopied
                  ? "bg-green-500/20 text-green-400"
                  : "bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30"
              )}
            >
              {linkCopied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <button
            onClick={() => {
              setInviteLink(null);
              setLinkCopied(false);
            }}
            className="mt-2 text-[10px] text-[#8b7ca8] hover:text-white transition-colors font-display"
          >
            Создать новую ссылку
          </button>
        </div>
      )}
    </div>
  );
}
