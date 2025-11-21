/**
 * Audio file mapping for dance styles
 * Maps dance style IDs to audio file URLs
 */

export interface DanceAudioMapping {
  danceStyleId: string;
  audioUrl: string;
  pixabayUrl: string;
}

/**
 * Mapping of dance styles to their audio files
 * Audio files should be stored in public/audio/ directory
 * and trimmed to exactly 10 seconds
 */
export const DANCE_AUDIO_MAPPING: Record<string, DanceAudioMapping> = {
  macarena: {
    danceStyleId: 'macarena',
    audioUrl: '/audio/macarena-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/upbeat-party-salsa-music-350025/',
  },
  salsa: {
    danceStyleId: 'salsa',
    audioUrl: '/audio/salsa-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/comedy-salsa-latin-party-music-349496/',
  },
  hip_hop: {
    danceStyleId: 'hip_hop',
    audioUrl: '/audio/hip-hop-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/beats-experimental-cinematic-hip-hop-315904/',
  },
  robot: {
    danceStyleId: 'robot',
    audioUrl: '/audio/robot-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/upbeat-la-danse-des-robots-11919/',
  },
  ballet: {
    danceStyleId: 'ballet',
    audioUrl: '/audio/ballet-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/modern-classical-ballet-music-dancing-in-the-moonlight-218472/',
  },
  disco: {
    danceStyleId: 'disco',
    audioUrl: '/audio/disco-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/upbeat-upbeat-disco-funk-house-instrumental-version-264050/',
  },
  breakdance: {
    danceStyleId: 'breakdance',
    audioUrl: '/audio/breakdance-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/dance-freccero-record-to-the-decks-116085/',
  },
  waltz: {
    danceStyleId: 'waltz',
    audioUrl: '/audio/waltz-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/modern-classical-piano-waltz-elegant-and-graceful-instrumental-music-285601/',
  },
  tango: {
    danceStyleId: 'tango',
    audioUrl: '/audio/tango-10s.mp3',
    pixabayUrl: 'https://pixabay.com/music/tango-tango-instrumental-music-trongmusic-408675/',
  },
  // Note: cha_cha is not in music.md, so we'll skip it for now
  // cha_cha: {
  //   danceStyleId: 'cha_cha',
  //   audioUrl: '/audio/cha-cha-10s.mp3',
  //   pixabayUrl: '',
  // },
};

/**
 * Get the audio URL for a given dance style
 * Returns the full URL (including domain) for the audio file
 * This is required because RunComfy API needs a publicly accessible HTTPS URL
 */
export function getAudioUrlForDanceStyle(danceStyleId: string): string | null {
  const mapping = DANCE_AUDIO_MAPPING[danceStyleId];
  if (!mapping) {
    console.warn(`[AudioMapping] No audio file found for dance style: ${danceStyleId}`);
    return null;
  }

  // Construct absolute URL for the audio file
  // Replicate API requires a publicly accessible HTTPS URL
  // We should use the production domain, not preview deployments which may require auth
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // If no production base URL is set, return null (audio will be skipped)
  // We don't use VERCEL_URL because it points to preview deployments that may require authentication
  if (!baseUrl) {
    console.warn(`[AudioMapping] No NEXT_PUBLIC_APP_URL configured for audio files. Audio will be skipped.`);
    return null;
  }
  
  // Ensure we have a proper HTTPS URL (not localhost in production)
  if (baseUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn(`[AudioMapping] Localhost URL detected in production, skipping audio: ${baseUrl}`);
    return null;
  }
  
  // Skip if this is a preview deployment (contains vercel.app but not the production domain)
  // Preview deployments may require authentication and won't be accessible to Replicate
  if (baseUrl.includes('vercel.app') && !baseUrl.includes('petgroove.app')) {
    console.warn(`[AudioMapping] Preview deployment detected, skipping audio to avoid 401 errors: ${baseUrl}`);
    return null;
  }
  
  const audioUrl = mapping.audioUrl.startsWith('http') 
    ? mapping.audioUrl 
    : `${baseUrl}${mapping.audioUrl}`;
  
  return audioUrl;
}

/**
 * Get the audio URL for a given dance style (relative path)
 * Use this when you need the relative path for client-side usage
 */
export function getAudioPathForDanceStyle(danceStyleId: string): string | null {
  const mapping = DANCE_AUDIO_MAPPING[danceStyleId];
  return mapping?.audioUrl || null;
}

