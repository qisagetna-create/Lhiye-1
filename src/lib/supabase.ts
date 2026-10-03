import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../types';
import { defaultAppConfig } from '../data/defaultConfig';

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
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Reads complete AppConfig directly from Supabase (or fallback to /api/config)
 */
export async function fetchAppConfigFromSupabase(): Promise<AppConfig | null> {
  // If client-side Supabase client is available, try reading directly from tables
  if (supabase) {
    try {
      // 1. Fetch profile
      let profileData: any = null;
      const { data: pData, error: pError } = await supabase
        .from('profile')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!pError && pData) {
        profileData = pData;
      } else {
        // Fallback check if table was named 'profiles'
        const { data: psData } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (psData) profileData = psData;
      }

      // 2. Fetch links
      const { data: linksRows } = await supabase
        .from('links')
        .select('*')
        .order('order_index', { ascending: true });

      if (profileData || (linksRows && linksRows.length > 0)) {
        return {
          profile: {
            logoMode: profileData?.logo_mode || defaultAppConfig.profile.logoMode,
            avatarUrl: profileData?.avatar_url || defaultAppConfig.profile.avatarUrl,
            avatarShape: profileData?.avatar_shape || defaultAppConfig.profile.avatarShape,
            avatarFit: profileData?.avatar_fit || defaultAppConfig.profile.avatarFit,
            avatarZoom: Number(profileData?.avatar_zoom) || 100,
            avatarPosX: Number(profileData?.avatar_pos_x) || 0,
            avatarPosY: Number(profileData?.avatar_pos_y) || 0,
            monogramText: profileData?.monogram_text || defaultAppConfig.profile.monogramText,
            name: profileData?.username || profileData?.name || defaultAppConfig.profile.name,
            displayName: profileData?.name || defaultAppConfig.profile.displayName,
            description: profileData?.description || defaultAppConfig.profile.description,
            verified: profileData?.verified !== undefined ? Boolean(profileData.verified) : defaultAppConfig.profile.verified,
            verifiedBadgeType: profileData?.verified_badge_type || defaultAppConfig.profile.verifiedBadgeType,
            avatarBg: profileData?.avatar_bg || defaultAppConfig.profile.avatarBg,
            footerText: profileData?.footer_text || defaultAppConfig.profile.footerText,
          },
          theme: profileData?.theme || defaultAppConfig.theme,
          sections: [
            {
              id: 'section-main',
              title: profileData?.section_title || defaultAppConfig.sections[0].title,
              order: 1,
              links:
                linksRows && linksRows.length > 0
                  ? linksRows.map((r: any, idx: number) => ({
                      id: r.id,
                      title: r.title,
                      subtitle: r.subtitle || '',
                      url: r.url,
                      icon: r.icon || 'globe',
                      visible: r.is_active !== false,
                      order: typeof r.order_index === 'number' ? r.order_index : idx + 1,
                      clicks: Number(r.clicks) || 0,
                    }))
                  : defaultAppConfig.sections[0].links,
            },
          ],
        };
      }
    } catch (e) {
      console.warn('Client direct Supabase query failed, falling back to /api/config', e);
    }
  }

  // Fallback to /api/config with no-store cache control
  try {
    const res = await fetch(`/api/config?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config) {
        return data.config;
      }
    }
  } catch (err) {
    console.error('Failed to fetch config from /api/config:', err);
  }

  return null;
}

/**
 * Realtime Subscription for live updates across open browser tabs/devices
 */
export function subscribeToDatabaseChanges(onUpdate: () => void): () => void {
  if (!supabase) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile' },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'links' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('Could not setup Supabase realtime subscription:', err);
    return () => {};
  }
}

/**
 * Saves configuration to the database via authenticated server endpoint (/api/config).
 */
export async function saveConfigToDatabase(
  config: AppConfig
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ config }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Məlumatları bazaya saxlamaq mümkün olmadı.',
      };
    }

    return {
      success: true,
      message: data.message || 'Məlumatlar uğurla saxlanıldı!',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Serverlə əlaqə qurula bilmədi. İnternet bağlantınızı yoxlayın.',
    };
  }
}

/**
 * Uploads compressed avatar to Supabase Storage ('avatars' bucket)
 * and updates public URL in 'profile' database table.
 */
export async function uploadAvatarToSupabase(
  compressedFile: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase konfiqurasiyası tapılmadı. Vercel-də VITE_SUPABASE_URL və VITE_SUPABASE_ANON_KEY təyin edin.',
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

    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Bilinməyən xəta baş verdi' };
  }
}

/**
 * Clears avatar_url from Supabase database
 */
export async function removeAvatarFromSupabase(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('profile').upsert({
      id: 'main',
      avatar_url: null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      await supabase.from('profiles').upsert({
        id: 'main',
        avatar_url: null,
        updated_at: new Date().toISOString(),
      });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

