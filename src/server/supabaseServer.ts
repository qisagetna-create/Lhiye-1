import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../types.js';
import { defaultAppConfig } from '../data/defaultConfig.js';
import { extractSessionToken, verifySessionToken } from './authHandler.js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isServerSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const serverSupabase: SupabaseClient | null = isServerSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// In-memory fallback if Supabase is temporarily unreachable or during initial setup
let memoryConfigCache: AppConfig = { ...defaultAppConfig };

/**
 * Reads config from Supabase database ('profile' and 'links' tables)
 */
export async function getServerConfig(): Promise<AppConfig> {
  if (!serverSupabase) {
    return memoryConfigCache;
  }

  try {
    // 1. Fetch profile record
    let profileData: any = null;
    const { data: pData, error: pError } = await serverSupabase
      .from('profile')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!pError && pData) {
      profileData = pData;
    } else {
      // Fallback check if table was named 'profiles'
      const { data: psData } = await serverSupabase
        .from('profiles')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (psData) profileData = psData;
    }

    // 2. Fetch links
    const { data: linksRows, error: lError } = await serverSupabase
      .from('links')
      .select('*')
      .order('order_index', { ascending: true });

    if (!profileData && (!linksRows || linksRows.length === 0)) {
      return memoryConfigCache;
    }

    // Merge into AppConfig
    const config: AppConfig = {
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

    memoryConfigCache = config;
    return config;
  } catch (err) {
    console.error('Error fetching config from server Supabase:', err);
    return memoryConfigCache;
  }
}

/**
 * Writes config to Supabase database ('profile' and 'links' tables)
 */
export async function saveServerConfig(newConfig: AppConfig): Promise<{ success: boolean; message?: string; error?: string }> {
  memoryConfigCache = newConfig;

  if (!serverSupabase) {
    return {
      success: true,
      message: 'Məlumatlar yadda saxlanıldı (Supabase açarları daxil edildikdə bazaya da avtomatik yazılacaq).',
    };
  }

  try {
    const mainSection = newConfig.sections[0] || defaultAppConfig.sections[0];

    // 1. Upsert profile table
    const profilePayload: any = {
      id: 'main',
      name: newConfig.profile.displayName || newConfig.profile.name,
      username: newConfig.profile.name,
      description: newConfig.profile.description,
      section_title: mainSection?.title || 'Elaqe ve Melumat',
      footer_text: newConfig.profile.footerText || 'nmexman · QisaGet Platforması',
      verified: Boolean(newConfig.profile.verified),
      verified_badge_type: newConfig.profile.verifiedBadgeType || 'blue',
      avatar_url: newConfig.profile.avatarUrl || '/avatar.jpg',
      logo_mode: newConfig.profile.logoMode || 'image',
      monogram_text: newConfig.profile.monogramText || 'NMEXMAN',
      avatar_shape: newConfig.profile.avatarShape || 'circle',
      avatar_fit: newConfig.profile.avatarFit || 'cover',
      avatar_zoom: newConfig.profile.avatarZoom || 100,
      avatar_pos_x: newConfig.profile.avatarPosX || 0,
      avatar_pos_y: newConfig.profile.avatarPosY || 0,
      theme: newConfig.theme,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await serverSupabase
      .from('profile')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      // If table doesn't exist, try 'profiles' table
      const { error: fallbackError } = await serverSupabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (fallbackError) {
        return {
          success: false,
          error: `Profil cədvəli xətası: ${profileError.message}. Zəhmət olmasa Supabase SQL Editor-da cədvəli yaradın.`,
        };
      }
    }

    // 2. Synchronize links table
    const allLinks = newConfig.sections.flatMap((sec) =>
      sec.links.map((link, idx) => ({
        id: link.id,
        section_id: sec.id || 'section-main',
        title: link.title,
        subtitle: link.subtitle || '',
        url: link.url,
        icon: link.icon || 'globe',
        order_index: typeof link.order === 'number' ? link.order : idx + 1,
        is_active: link.visible !== false,
        clicks: link.clicks || 0,
        updated_at: new Date().toISOString(),
      }))
    );

    if (allLinks.length > 0) {
      const { error: linksUpsertError } = await serverSupabase
        .from('links')
        .upsert(allLinks, { onConflict: 'id' });

      if (linksUpsertError) {
        return {
          success: false,
          error: `Linklər cədvəli xətası: ${linksUpsertError.message}`,
        };
      }

      // Delete removed links from table
      const activeIds = allLinks.map((l) => l.id);
      await serverSupabase
        .from('links')
        .delete()
        .not('id', 'in', `(${activeIds.map((id) => `"${id}"`).join(',')})`);
    } else {
      // If no links, clear table
      await serverSupabase.from('links').delete().neq('id', '___non_existent___');
    }

    // Broadcast instant update to all connected clients across devices
    broadcastConfigUpdate(newConfig);

    return {
      success: true,
      message: 'Saxlanıldı və canlı saytda yeniləndi',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Bilinməyən server xətası baş verdi',
    };
  }
}

// Active Server-Sent Events (SSE) connections for zero-delay synchronization
const sseClients = new Set<any>();

export function handleSseStream(req: any, res: any) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
  sseClients.add(res);

  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    sseClients.delete(res);
  });
}

export function broadcastConfigUpdate(config: AppConfig) {
  const data = JSON.stringify({ type: 'config_updated', timestamp: Date.now(), config });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

/**
 * GET /api/config
 */
export async function handleGetConfig(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const config = await getServerConfig();
  return res.json({ success: true, config, timestamp: Date.now() });
}

/**
 * POST /api/config (Admin session required)
 */
export async function handleSaveConfig(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Verify Admin Session
  const token = extractSessionToken(req);
  if (!token || !verifySessionToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'İcazə verilmədi: Dəyişiklikləri yadda saxlamaq üçün admin girişi tələb olunur.',
    });
  }

  const { config } = req.body || {};
  if (!config || typeof config !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Düzgün konfiqurasiya məlumatı göndərilmədi.',
    });
  }

  const result = await saveServerConfig(config);
  if (!result.success) {
    return res.status(500).json(result);
  }

  return res.json(result);
}

