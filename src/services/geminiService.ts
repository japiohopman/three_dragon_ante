
import { GameState, NPCData } from '../types';

export class GeminiService {
  static async generateNPC(theme: string): Promise<any> {
    try {
      const response = await fetch('/api/artificer/generate-npc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate NPC');
      }

      return await response.json();
    } catch (error) {
      console.error('[GeminiService] Error generating NPC:', error);
      return null;
    }
  }

  static async pushToVault(npc: any): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const response = await fetch('/api/artificer/push-to-vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ npc }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to push to Guild Vault');
      }

      return data;
    } catch (error: any) {
      console.error('[GeminiService] Error pushing to Vault:', error);
      return { success: false, error: error.message };
    }
  }
}
