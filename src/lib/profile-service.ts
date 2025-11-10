import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

// Utility function for clean error logging
const logError = (message: string, error: any) => {
  if (error?.message || error?.code) {
    console.warn(`${message}:`, error.code || error.message);
  } else if (Object.keys(error || {}).length > 0) {
    console.warn(`${message}:`, error);
  }
  // Don't log completely empty error objects
};

export const ProfileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        // Only log meaningful errors, not empty objects
        logError('Profile fetch warning', error);
        return null;
      }
      return data;
    } catch (error: any) {
      // Only log actual errors, not empty objects
      logError('Profile service error', error);
      return null;
    }
  },

  async cacheProfile(profile: UserProfile): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profile);

      if (error) {
        logError('Profile cache error', error);
      }
    } catch (error: any) {
      logError('Profile caching exception', error);
    }
  },

  async migrateLocalStorageProfile(uid: string): Promise<void> {
    // For transition period - checks localStorage first, then migrates to Supabase
    const localStorageKey = `apsconnect_user_${uid}`;
    const localProfile = localStorage.getItem(localStorageKey);
    
    if (localProfile) {
      try {
        const profile = JSON.parse(localProfile);
        await this.cacheProfile(profile);
        localStorage.removeItem(localStorageKey);
      } catch (error) {
        console.error('Migration failed for user:', uid, error);
      }
    }
  }
};
