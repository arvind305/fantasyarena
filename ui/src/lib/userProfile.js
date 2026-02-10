/**
 * userProfile.js — Save and retrieve user profiles from Supabase.
 *
 * Called on sign-in to ensure user info (name, email, avatar) is stored
 * in the database for leaderboard display and future features.
 */

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Save or update user profile in Supabase.
 * Called on every sign-in to keep profile data fresh.
 *
 * @param {Object} user - User object from Google OAuth
 * @param {string} user.userId - Google user ID (sub claim)
 * @param {string} user.name - Display name
 * @param {string} user.email - Email address
 * @param {string} user.avatar - Avatar URL
 */
export async function saveUserProfile(user) {
  if (!user?.userId) {
    console.log('[userProfile] No user to save');
    return { success: false, error: 'No user provided' };
  }

  if (!supabase || !isSupabaseConfigured()) {
    console.log('[userProfile] Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        user_id: user.userId,
        email: user.email || null,
        display_name: user.name || `User ${user.userId.substring(0, 8)}`,
        avatar_url: user.avatar || null,
        last_sign_in: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.warn('[userProfile] Failed to save profile:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[userProfile] Profile saved for', user.email || user.userId.substring(0, 12));

    // Ensure new users have a leaderboard entry (insert only, never overwrite scores)
    const displayName = user.name || `User ${user.userId.substring(0, 8)}`;
    await supabase
      .from('leaderboard')
      .upsert({
        event_id: 't20wc_2026',
        user_id: user.userId,
        display_name: displayName,
        total_score: 0,
        matches_played: 0,
        last_match_score: 0
      }, { onConflict: 'event_id,user_id', ignoreDuplicates: true });

    // Always update display name for existing entries (without touching scores)
    await supabase
      .from('leaderboard')
      .update({ display_name: displayName })
      .eq('user_id', user.userId);

    return { success: true };
  } catch (err) {
    console.warn('[userProfile] Error saving profile:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get user profile from Supabase.
 *
 * @param {string} userId - Google user ID
 * @returns {Object|null} User profile or null if not found
 */
export async function getUserProfile(userId) {
  if (!userId || !supabase || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
