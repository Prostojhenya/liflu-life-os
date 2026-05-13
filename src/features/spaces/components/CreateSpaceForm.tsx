/**
 * CreateSpaceForm Component
 * Form for creating new spaces
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpaceType } from '@/domain/models/Space';

interface CreateSpaceFormProps {
  isCreating: boolean;
  onCreateSpace: (name: string, type: SpaceType) => Promise<void>;
}

export function CreateSpaceForm({ isCreating, onCreateSpace }: CreateSpaceFormProps) {
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState<SpaceType>('personal');

  const handleSubmit = async () => {
    if (!newSpaceName.trim() || isCreating) return;

    try {
      await onCreateSpace(newSpaceName.trim(), newSpaceType);
      setNewSpaceName('');
      setNewSpaceType('personal');
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <div className="pt-4 border-t border-white/10">
      <div className="mb-3">
        <label className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display mb-2 block">
          Тип пространства
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setNewSpaceType('personal')}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-black uppercase font-display transition-all",
              newSpaceType === 'personal'
                ? "bg-accent-blue text-white"
                : "bg-white/5 text-[#8b7ca8] hover:bg-white/10"
            )}
          >
            Личное
          </button>
          <button
            onClick={() => setNewSpaceType('shared')}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-black uppercase font-display transition-all",
              newSpaceType === 'shared'
                ? "bg-accent-purple text-white"
                : "bg-white/5 text-[#8b7ca8] hover:bg-white/10"
            )}
          >
            Общее
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Название пространства..."
          className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
          disabled={isCreating}
        />
        <button
          onClick={handleSubmit}
          disabled={!newSpaceName.trim() || isCreating}
          className="w-12 h-12 bg-accent-purple text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
