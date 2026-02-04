
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// KONFIGURASI SUPABASE CLIENT
// ============================================================================

const PROJECT_URL = "https://hhfoifeigqfonhalwzfg.supabase.co";
const ANON_KEY = "sb_publishable_QdjZi-pF62kSost02k_Fpg_8K4XuBwL";

export const supabase = createClient(PROJECT_URL, ANON_KEY);
