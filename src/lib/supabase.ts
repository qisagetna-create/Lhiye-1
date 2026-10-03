import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface ProfileRecord {
  id?: string;
  avatar_url: string | null;
  updated_at?: string;
}

/**
 * Reads avatar URL directly from Supabase database (profiles table).
 * Returns null if no record or no image found.
 */
export async function fetchAvatarUrlFromSupabase(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', 'main')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      // Try fetching the first row if id is not 'main'
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .limit(1)
        .maybeSingle();

      return fallbackData?.avatar_url || null;
    }

    return data?.avatar_url || null;
  } catch (err) {
    console.error('Failed to fetch avatar from Supabase:', err);
    return null;
  }
}

/**
 * Uploads compressed avatar to Supabase Storage ('avatars' bucket)
 * and updates public URL in 'profiles' database table.
 */
export async function uploadAvatarToSupabase(
  compressedFile: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase konfiqurasiyası tapılmadı. Zəhmət olmasa Vercel-də VITE_SUPABASE_URL və VITE_SUPABASE_ANON_KEY təyin edin.',
    };
  }

  try {
    const fileExt = compressedFile.name.split('.').pop() || 'jpg';
    const filePath = `profile_avatar_${Date.now()}.${fileExt}`;

    // 1. Upload to Supabase Storage (avatars bucket)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: compressedFile.type,
      });

    if (uploadError) {
      return { success: false, error: `Storage yükləmə xətası: ${uploadError.message}` };
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    if (!publicUrl) {
      return { success: false, error: 'Şəklin ictimai (public) linki alına bilmədi.' };
    }

    // 3. Save URL to Supabase Database (profiles table)
    const { error: dbError } = await supabase.from('profiles').upsert(
      {
        id: 'main',
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (dbError) {
      return {
        success: false,
        url: publicUrl,
        error: `Baza qeyd xətası: ${dbError.message}. Amma şəkil Storage-ə yükləndi.`,
      };
    }

    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Bilinməyən xəta baş verdi' };
  }
}

/**
 * Removes avatar from Supabase database (sets avatar_url to null)
 */
export async function removeAvatarFromSupabase(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: 'main',
      avatar_url: null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
