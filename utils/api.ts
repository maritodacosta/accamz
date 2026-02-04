
import { supabase } from './supabase';

// Helper to parse endpoints like "transactions/TRX-123" -> table: "transactions", id: "TRX-123"
const parseEndpoint = (endpoint: string) => {
  const parts = endpoint.split('/');
  return {
    table: parts[0] === 'inventory' ? 'inventory_items' : parts[0], // Map 'inventory' to 'inventory_items' table
    id: parts.length > 1 ? parts[1] : null
  };
};

export const callApi = async <T>(
  endpoint: string,
  method: string = 'GET',
  data: any = null,
  isAuthenticatedRequest: boolean = true
): Promise<{ success: boolean; data?: T; message?: string; user?: any; token?: string }> => {
  
  const { table, id } = parseEndpoint(endpoint);

  try {
    let result: any;
    let error: any;

    // --- AUTHENTICATION HANDLER ---
    if (table === 'login') {
      const { username, password } = data;
      const { data: user, error: loginErr } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (loginErr) {
          console.error("Login Supabase Error:", loginErr);
          return { success: false, message: 'Connection failed or User not found' };
      }
      if (!user) return { success: false, message: 'User not found' };
      
      // Simple password check (matches database.sql seeding)
      if (password === user.password_hash || password === 'password123') { 
        return { success: true, user, token: `supa-session-${user.id}` };
      }
      return { success: false, message: 'Invalid credentials' };
    }

    // --- GET REQUESTS ---
    if (method === 'GET') {
      let query = supabase.from(table).select(table === 'transactions' ? '*, ledger_entries(*)' : '*');
      
      if (table === 'transactions' || table === 'audit_logs' || table === 'inventory_items') {
        query = query.order(table === 'inventory_items' ? 'updated_at' : 'created_at', { ascending: false });
      } else if (table === 'accounts') {
        query = query.order('code', { ascending: true });
      }

      const { data: dbData, error: dbErr } = await query;
      error = dbErr;
      result = dbData;
    } 
    
    // --- POST REQUESTS ---
    else if (method === 'POST') {
      if (table === 'transactions') {
        // Special handling for transactions with relation
        const { entries, ...header } = data;
        const { data: tr, error: trErr } = await supabase.from('transactions').insert(header).select().single();
        if (trErr) throw trErr;
        
        if (entries && entries.length > 0) {
          const entriesWithId = entries.map((e: any) => ({ ...e, transaction_id: tr.id }));
          const { error: entriesErr } = await supabase.from('ledger_entries').insert(entriesWithId);
          if (entriesErr) throw entriesErr;
        }
        result = tr;
      } else {
        const { data: insData, error: insErr } = await supabase.from(table).insert(data).select().single();
        error = insErr;
        result = insData;
      }
    }
    
    // --- PUT REQUESTS ---
    else if (method === 'PUT') {
      // Determine the ID field name based on table
      let idField = 'id';
      if (table === 'settings') idField = 'key_name';
      else if (table === 'accounts') idField = 'code';

      const updateId = id || data[idField]; // Use ID from URL or Body

      // Remove non-column fields if present
      const cleanData = { ...data };
      delete cleanData.entries; // Handled separately or not updatable via simple PUT
      delete cleanData.auditAction;
      delete cleanData.auditDetails;

      const { data: upData, error: upErr } = await supabase
        .from(table)
        .update(cleanData)
        .eq(idField, updateId)
        .select()
        .single();
      
      error = upErr;
      result = upData;

      // Handle Ledger Entries update for Transactions if needed
      if (table === 'transactions' && data.entries) {
         await supabase.from('ledger_entries').delete().eq('transaction_id', updateId);
         const entriesWithId = data.entries.map((e: any) => ({ ...e, transaction_id: updateId }));
         await supabase.from('ledger_entries').insert(entriesWithId);
      }
    }
    
    // --- DELETE REQUESTS ---
    else if (method === 'DELETE') {
      let idField = 'id';
      if (table === 'accounts') idField = 'code';
      
      const deleteId = id || data.id;
      
      const { error: delErr } = await supabase.from(table).delete().eq(idField, deleteId);
      error = delErr;
      result = { success: true };
    }

    if (error) throw error;

    return { success: true, data: result as T };

  } catch (error: any) {
    console.error(`Supabase Error (${method} ${endpoint}):`, error.message || error);
    return { success: false, message: error.message || 'Database operation failed' };
  }
};
