// ============================================================
// db.js  – Async data layer for LingapApu
// All Supabase operations live here.  Every function returns a
// resolved value (never throws to the caller).
//
// Depends on: supabase-config.js  (window.supabaseClient)
// ============================================================

/* ── helpers ────────────────────────────────────────────── */
function _sb() {
  if (!window.supabaseClient) {
    const msg = 'Supabase client not initialized - ensure supabase-config.js loaded after Supabase CDN script';
    console.error('[db._sb] CRITICAL:', msg);
    console.error('[db._sb] window.supabase available:', !!window.supabase);
    console.error('[db._sb] window.supabaseClient available:', !!window.supabaseClient);
    throw new Error(msg);
  }
  return window.supabaseClient;
}

function _uid() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

// Central error reporter (non-throwing)
function _err(label, error) {
  console.error('[db]', label, error?.message || error);
}

// ============================================================
// window.db  – public API
// ============================================================
window.db = {

  // ──────────────────────────────────────────────────────────
  // AUTH / USERS
  // ──────────────────────────────────────────────────────────

  /**
   * Validate username + password against the `users` table.
   * Returns the matching user object or null.
   */
  async login(username, password) {
    try {
      const { data, error } = await _sb()
        .from('users')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .eq('password', password.trim())
        .maybeSingle();
      if (error) { _err('login', error); return null; }
      return data || null;
    } catch (e) { _err('login', e); return null; }
  },

  /**
   * Fetch all staff + merchant users.
   */
  async getStaff() {
    try {
      const { data, error } = await _sb()
        .from('users')
        .select('*')
        .in('role', ['osca', 'merchant'])
        .order('created_at', { ascending: true });
      if (error) { _err('getStaff', error); return []; }
      return data || [];
    } catch (e) { _err('getStaff', e); return []; }
  },

  /**
   * Create a new staff/merchant user.
   */
  async addStaff(staff) {
    try {
      const payload = {
        id:         staff.id || ('STAFF-' + Date.now()),
        name:       staff.name,
        username:   staff.username.trim().toLowerCase(),
        password:   staff.password,
        role:       staff.role,
        contact:    staff.contact || '',
        email:      staff.email  || '',
        date_added: staff.dateAdded || new Date().toISOString().split('T')[0]
      };
      const { data, error } = await _sb().from('users').insert(payload).select().single();
      if (error) { _err('addStaff', error); return null; }
      return data;
    } catch (e) { _err('addStaff', e); return null; }
  },

  /**
   * Update a user record.
   */
  async updateStaff(id, updates) {
    try {
      const { data, error } = await _sb()
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) { _err('updateStaff', error); return null; }
      return data;
    } catch (e) { _err('updateStaff', e); return null; }
  },

  /**
   * Delete a user.
   */
  async deleteStaff(id) {
    try {
      const { error } = await _sb().from('users').delete().eq('id', id);
      if (error) { _err('deleteStaff', error); return false; }
      return true;
    } catch (e) { _err('deleteStaff', e); return false; }
  },

  /**
   * Change password for a user by id.
   */
  async changePassword(id, newPassword) {
    try {
      const { error } = await _sb()
        .from('users')
        .update({ password: newPassword })
        .eq('id', id);
      if (error) { _err('changePassword', error); return false; }
      return true;
    } catch (e) { _err('changePassword', e); return false; }
  },

  // ──────────────────────────────────────────────────────────
  // SENIORS
  // ──────────────────────────────────────────────────────────

  /**
   * Fetch all active senior profiles.
   */
  async getSeniors() {
    try {
      const { data, error } = await _sb()
        .from('seniors')
        .select('*')
        .order('name', { ascending: true });
      if (error) { 
        console.error('[db.getSeniors] Supabase error:', error);
        _err('getSeniors', error);
        return []; 
      }
      console.log('[db.getSeniors] Success: returned', (data || []).length, 'seniors');
      // Ensure benefits is always an array
      return (data || []).map(s => ({
        ...s,
        benefits: Array.isArray(s.benefits) ? s.benefits : []
      }));
    } catch (e) { 
      console.error('[db.getSeniors] Exception:', e);
      _err('getSeniors', e); 
      return []; 
    }
  },

  /**
   * Fetch a single senior by id.
   */
  async getSeniorById(id) {
    try {
      const { data, error } = await _sb()
        .from('seniors')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) { _err('getSeniorById', error); return null; }
      if (!data) return null;
      return { ...data, benefits: Array.isArray(data.benefits) ? data.benefits : [] };
    } catch (e) { _err('getSeniorById', e); return null; }
  },

  /**
   * Fetch a single senior by username.
   */
  async getSeniorByUsername(username) {
    try {
      const { data, error } = await _sb()
        .from('seniors')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle();
      if (error) { _err('getSeniorByUsername', error); return null; }
      if (!data) return null;
      return { ...data, benefits: Array.isArray(data.benefits) ? data.benefits : [] };
    } catch (e) { _err('getSeniorByUsername', e); return null; }
  },

  /**
   * Add a new senior profile.
   */
  async addSenior(senior) {
    try {
      const payload = {
        id:                senior.id,
        name:              senior.name,
        birth:             senior.birth        || null,
        age:               senior.age          || null,
        gender:            senior.gender       || null,
        contact:           senior.contact      || null,
        address:           senior.address      || null,
        username:          senior.username     || null,
        password:          senior.password     || null,
        benefits:          Array.isArray(senior.benefits) ? senior.benefits : [],
        notes:             senior.notes        || null,
        registration_date: senior.registrationDate || new Date().toISOString(),
        status:            (senior.status || 'active').toLowerCase(),
        photo:             senior.photo        || null,
        civil_status:      senior.civilStatus  || senior.civil_status || null,
        barangay:          senior.barangay     || null
      };
      const { data, error } = await _sb()
        .from('seniors')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (error) { _err('addSenior', error); return null; }
      return data;
    } catch (e) { _err('addSenior', e); return null; }
  },

  /**
   * Update a senior profile.
   */
  async updateSenior(id, updates) {
    try {
      // Map camelCase keys to snake_case where needed
      const payload = {};
      if (updates.name              !== undefined) payload.name              = updates.name;
      if (updates.birth             !== undefined) payload.birth             = updates.birth;
      if (updates.age               !== undefined) payload.age               = updates.age;
      if (updates.gender            !== undefined) payload.gender            = updates.gender;
      if (updates.contact           !== undefined) payload.contact           = updates.contact;
      if (updates.address           !== undefined) payload.address           = updates.address;
      if (updates.username          !== undefined) payload.username          = updates.username;
      if (updates.password          !== undefined) payload.password          = updates.password;
      if (updates.benefits          !== undefined) payload.benefits          = Array.isArray(updates.benefits) ? updates.benefits : (typeof updates.benefits === 'string' && updates.benefits ? updates.benefits.split(',').map(b => b.trim()).filter(Boolean) : []);
      if (updates.notes             !== undefined) payload.notes             = updates.notes;
      if (updates.status            !== undefined) payload.status            = updates.status;
      if (updates.photo             !== undefined) payload.photo             = updates.photo;
      if (updates.qr_code           !== undefined) payload.qr_code           = updates.qr_code;
      if (updates.civil_status      !== undefined) payload.civil_status      = updates.civil_status;
      if (updates.civilStatus       !== undefined) payload.civil_status      = updates.civilStatus;
      if (updates.barangay          !== undefined) payload.barangay          = updates.barangay;
      if (updates.registrationDate  !== undefined) payload.registration_date = updates.registrationDate;
      // Note: 'email' lives in the users table, not seniors — do not include it here

      const { data, error } = await _sb()
        .from('seniors')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) { _err('updateSenior', error); return null; }
      return data;
    } catch (e) { _err('updateSenior', e); return null; }
  },

  /**
   * Persist a generated QR code data-URL to the seniors table.
   * Called once after the QR is first rendered; subsequent loads read it back.
   */
  async saveQRCode(seniorId, dataURL) {
    try {
      const { data, error } = await _sb()
        .from('seniors')
        .update({ qr_code: dataURL })
        .eq('id', seniorId)
        .select('id, qr_code')
        .single();
      if (error) { _err('saveQRCode', error); return null; }
      return data;
    } catch (e) { _err('saveQRCode', e); return null; }
  },

  /**
   * Delete a senior.
   */
  async deleteSenior(id) {
    try {
      const { error } = await _sb().from('seniors').delete().eq('id', id);
      if (error) { _err('deleteSenior', error); return false; }
      return true;
    } catch (e) { _err('deleteSenior', e); return false; }
  },

  /**
   * Batch-upsert multiple seniors (used for initial seed).
   */
  async upsertSeniors(seniorsArray) {
    try {
      const rows = seniorsArray.map(s => ({
        id:                s.id,
        name:              s.name,
        birth:             s.birth             || null,
        age:               s.age               || null,
        gender:            s.gender            || null,
        contact:           s.contact           || null,
        address:           s.address           || null,
        username:          s.username          || null,
        password:          s.password          || null,
        benefits:          Array.isArray(s.benefits) ? s.benefits : [],
        notes:             s.notes             || null,
        registration_date: s.registrationDate  || s.registration_date || new Date().toISOString(),
        status:            s.status            || 'active',
        photo:             s.photo             || null
      }));
      const { error } = await _sb()
        .from('seniors')
        .upsert(rows, { onConflict: 'id' });
      if (error) { _err('upsertSeniors', error); return false; }
      return true;
    } catch (e) { _err('upsertSeniors', e); return false; }
  },

  // ──────────────────────────────────────────────────────────
  // TRANSACTIONS
  // ──────────────────────────────────────────────────────────

  /**
   * Fetch ALL transactions, optionally filtered by seniorId.
   */
  async getTransactions(seniorId = null) {
    try {
      let q = _sb()
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });
      if (seniorId) q = q.eq('senior_id', seniorId);
      const { data, error } = await q;
      if (error) { _err('getTransactions', error); return []; }
      return data || [];
    } catch (e) { _err('getTransactions', e); return []; }
  },

  /**
   * Save a single transaction.
   */
  async addTransaction(txn) {
    try {
      const payload = {
        id:          txn.id          || ('TXN-' + Date.now()),
        senior_id:   txn.seniorId    || txn.senior_id   || null,
        senior_name: txn.seniorName  || txn.senior_name || null,
        timestamp:   txn.timestamp   || new Date().toISOString(),
        type:        txn.type        || null,
        amount:      txn.amount      || null,
        note:        txn.note        || null,
        merchant_id: txn.merchantId  || txn.merchant_id || null,
        scan_date:   txn.scanDate    || txn.scan_date   || null,
        status:      txn.status      || 'Completed'
      };
      const { data, error } = await _sb()
        .from('transactions')
        .insert(payload)
        .select()
        .single();
      if (error) { _err('addTransaction', error); return null; }
      return data;
    } catch (e) { _err('addTransaction', e); return null; }
  },

  /**
   * Batch-upsert transactions (seed / import).
   */
  async upsertTransactions(txnsArray) {
    try {
      const rows = txnsArray.map((t, i) => ({
        id:          t.id         || ('TXN-' + Date.now() + '-' + i),
        senior_id:   t.seniorId   || t.senior_id   || null,
        senior_name: t.seniorName || t.senior_name || null,
        timestamp:   t.timestamp  || new Date().toISOString(),
        type:        t.type       || null,
        amount:      t.amount     || null,
        note:        t.note       || null,
        merchant_id: t.merchantId || t.merchant_id || null,
        scan_date:   t.scanDate   || t.scan_date   || null,
        status:      t.status     || 'Completed'
      }));
      const { error } = await _sb()
        .from('transactions')
        .upsert(rows, { onConflict: 'id' });
      if (error) { _err('upsertTransactions', error); return false; }
      return true;
    } catch (e) { _err('upsertTransactions', e); return false; }
  },

  // ──────────────────────────────────────────────────────────
  // BENEFITS
  // ──────────────────────────────────────────────────────────

  /** Fetch all benefit programs. */
  async getBenefits() {
    try {
      const { data, error } = await _sb()
        .from('benefits')
        .select('*')
        .order('name', { ascending: true });
      if (error) { _err('getBenefits', error); return []; }
      return data || [];
    } catch (e) { _err('getBenefits', e); return []; }
  },

  /** Add a benefit program. */
  async addBenefit(benefit) {
    try {
      const payload = {
        id:           benefit.id   || ('BEN-' + Date.now()),
        name:         benefit.name,
        description:  benefit.description  || '',
        amount:       benefit.amount       || 0,
        frequency:    benefit.frequency    || '',
        active:       benefit.active       !== false,
        eligibility:  benefit.eligibility  || '',
        coverage:     benefit.coverage     || '',
        date_created: benefit.dateCreated  || new Date().toISOString().split('T')[0]
      };
      const { data, error } = await _sb().from('benefits').insert(payload).select().single();
      if (error) { _err('addBenefit', error); return null; }
      return data;
    } catch (e) { _err('addBenefit', e); return null; }
  },

  /** Update a benefit program. */
  async updateBenefit(id, updates) {
    try {
      const { data, error } = await _sb()
        .from('benefits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) { _err('updateBenefit', error); return null; }
      return data;
    } catch (e) { _err('updateBenefit', e); return null; }
  },

  /** Delete a benefit program. */
  async deleteBenefit(id) {
    try {
      const { error } = await _sb().from('benefits').delete().eq('id', id);
      if (error) { _err('deleteBenefit', error); return false; }
      return true;
    } catch (e) { _err('deleteBenefit', e); return false; }
  },

  // ──────────────────────────────────────────────────────────
  // AGE-BASED BENEFITS
  // ──────────────────────────────────────────────────────────

  /** Fetch all age-based benefit tiers. */
  async getAgeBenefits() {
    try {
      const { data, error } = await _sb()
        .from('age_benefits')
        .select('*')
        .order('age', { ascending: true, nullsLast: true });
      if (error) { _err('getAgeBenefits', error); return {}; }
      // Convert rows back to the keyed object format the UI expects
      const result = {};
      (data || []).forEach(row => {
        const key = row.benefit_key;
        if (row.is_numeric) {
          result[key] = { age: row.age, amount: row.amount, description: row.description };
        } else {
          result[key] = {
            id:          key,
            name:        row.description,
            description: row.description,
            active:      row.active
          };
        }
      });
      return result;
    } catch (e) { _err('getAgeBenefits', e); return {}; }
  },

  /** Upsert a single age-benefit tier. */
  async upsertAgeBenefit(key, value) {
    try {
      const isNumeric = !isNaN(parseInt(key));
      const payload = {
        benefit_key:  String(key),
        age:          isNumeric ? parseInt(key) : null,
        amount:       value.amount      || 0,
        description:  value.description || (value.name || ''),
        benefit_type: isNumeric ? 'birthday' : 'special',
        is_numeric:   isNumeric,
        active:       value.active !== false
      };
      const { error } = await _sb()
        .from('age_benefits')
        .upsert(payload, { onConflict: 'benefit_key' });
      if (error) { _err('upsertAgeBenefit', error); return false; }
      return true;
    } catch (e) { _err('upsertAgeBenefit', e); return false; }
  },

  /** Delete an age-benefit tier. */
  async deleteAgeBenefit(key) {
    try {
      const { error } = await _sb()
        .from('age_benefits')
        .delete()
        .eq('benefit_key', String(key));
      if (error) { _err('deleteAgeBenefit', error); return false; }
      return true;
    } catch (e) { _err('deleteAgeBenefit', e); return false; }
  },

  // ──────────────────────────────────────────────────────────
  // PENDING REGISTRATIONS
  // ──────────────────────────────────────────────────────────

  /** Fetch all pending registration applications. */
  async getPendingRegistrations(status = 'pending') {
    try {
      let q = _sb()
        .from('pending_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) { _err('getPendingRegistrations', error); return []; }
      return data || [];
    } catch (e) { _err('getPendingRegistrations', e); return []; }
  },

  /** Submit a new registration application. */
  async addRegistration(reg) {
    try {
      const payload = {
        id:           reg.id          || ('SC-' + Date.now()),
        name:         reg.name,
        age:          reg.age         || null,
        birthday:     reg.birthday    || reg.birth || null,
        birth:        reg.birth       || reg.birthday || null,
        contact:      reg.contact     || null,
        address:      reg.address     || null,
        gender:       reg.gender      || null,
        photo:        reg.photo       || null,
        notes:        reg.notes       || null,
        username:     reg.username    ? reg.username.trim().toLowerCase() : null,
        password:     reg.password    || null,
        civil_status: reg.civilStatus || reg.civil_status || null,
        barangay:     reg.barangay    || null,
        date_applied: reg.dateApplied || new Date().toISOString().split('T')[0],
        status:       'pending'
      };
      console.log('[db.addRegistration] Payload being sent:', payload);
      const { data, error } = await _sb()
        .from('pending_registrations')
        .insert(payload)
        .select()
        .single();
      if (error) { _err('addRegistration', error); return null; }
      console.log('[db.addRegistration] Successfully saved registration:', data);
      return data;
    } catch (e) { _err('addRegistration', e); return null; }
  },

  /** Approve a registration (creates senior profile + user account). */
  async approveRegistration(regId, seniorPayload, userPayload) {
    try {
      // 1. Add senior profile
      const senior = await window.db.addSenior(seniorPayload);
      if (!senior) return false;

      // 2. Add user login account for the senior
      if (userPayload) {
        await _sb()
          .from('users')
          .upsert({
            id:        userPayload.id        || ('USR-' + Date.now()),
            name:      seniorPayload.name,
            username:  userPayload.username  ? userPayload.username.trim().toLowerCase() : null,
            password:  userPayload.password  || '1234',
            role:      'senior',
            senior_id: senior.id,
            email:     userPayload.email     || null
          }, { onConflict: 'username' })
          .select();
      }

      // 3. Mark registration as approved
      const { error } = await _sb()
        .from('pending_registrations')
        .update({ status: 'approved' })
        .eq('id', regId);
      if (error) { _err('approveRegistration:status', error); }

      return true;
    } catch (e) { _err('approveRegistration', e); return false; }
  },

  /**
   * Check whether a username exists in pending_registrations (any status).
   * Used to give a helpful "awaiting approval" login message.
   */
  async checkPendingUsername(username) {
    try {
      const { data, error } = await _sb()
        .from('pending_registrations')
        .select('status')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle();
      if (error) return null;
      return data || null; // { status: 'pending' | 'approved' | 'rejected' }
    } catch (e) { return null; }
  },

  /** Reject a registration application. */
  async rejectRegistration(regId) {
    try {
      const { error } = await _sb()
        .from('pending_registrations')
        .update({ status: 'rejected' })
        .eq('id', regId);
      if (error) { _err('rejectRegistration', error); return false; }
      return true;
    } catch (e) { _err('rejectRegistration', e); return false; }
  },

  // ──────────────────────────────────────────────────────────
  // USER BENEFITS  (per-senior benefit assignment records)
  // ──────────────────────────────────────────────────────────

  /**
   * Fetch all active user_benefits rows for a given senior.
   * Returns an array of rows: { id, senior_id, benefit_name, assigned_by, assigned_at, status, ... }
   */
  async getUserBenefits(seniorId) {
    try {
      const { data, error } = await _sb()
        .from('user_benefits')
        .select('*')
        .eq('senior_id', seniorId)
        .eq('status', 'active')
        .order('assigned_at', { ascending: true });
      if (error) { _err('getUserBenefits', error); return []; }
      return data || [];
    } catch (e) { _err('getUserBenefits', e); return []; }
  },

  /**
   * Upsert benefit assignments for a senior.
   * benefitNames: string[]  — e.g. ['20% Senior Discount', 'Burial Assistance']
   * assignedBy:   string    — OSCA username or user id
   * On conflict (senior_id, benefit_name) the row is re-activated with the new assignedBy.
   */
  async addUserBenefits(seniorId, benefitNames, assignedBy = null) {
    try {
      if (!Array.isArray(benefitNames) || benefitNames.length === 0) return [];
      const now = new Date().toISOString();
      const rows = benefitNames.map((name, i) => ({
        id:           `UBEN-${Date.now()}-${i}-${name.replace(/\W/g, '')}`,
        senior_id:    seniorId,
        benefit_name: name,
        assigned_by:  assignedBy,
        status:       'active',
        assigned_at:  now
      }));
      const { data, error } = await _sb()
        .from('user_benefits')
        .upsert(rows, { onConflict: 'senior_id,benefit_name' })
        .select();
      if (error) { _err('addUserBenefits', error); return null; }
      return data || [];
    } catch (e) { _err('addUserBenefits', e); return null; }
  },

  /**
   * Revoke a single benefit for a senior (sets status = 'revoked').
   */
  async revokeUserBenefit(seniorId, benefitName) {
    try {
      const { data, error } = await _sb()
        .from('user_benefits')
        .update({ status: 'revoked' })
        .eq('senior_id', seniorId)
        .eq('benefit_name', benefitName)
        .select();
      if (error) { _err('revokeUserBenefit', error); return null; }
      return data;
    } catch (e) { _err('revokeUserBenefit', e); return null; }
  },

  /**
   * Revoke ALL active benefits for a senior (e.g. when rejecting eligibility).
   */
  async revokeAllUserBenefits(seniorId) {
    try {
      const { data, error } = await _sb()
        .from('user_benefits')
        .update({ status: 'revoked' })
        .eq('senior_id', seniorId)
        .eq('status', 'active')
        .select();
      if (error) { _err('revokeAllUserBenefits', error); return null; }
      return data;
    } catch (e) { _err('revokeAllUserBenefits', e); return null; }
  },

  // ──────────────────────────────────────────────────────────
  // DASHBOARD STATS  (aggregate helpers)
  // ──────────────────────────────────────────────────────────

  /** Return quick stats for the admin dashboard. */
  async getDashboardStats() {
    try {
      const [seniorsRes, txnRes, registrationsRes] = await Promise.all([
        _sb().from('seniors').select('id, gender, birth, benefits, status', { count: 'exact' }),
        _sb().from('transactions').select('id, timestamp, type, amount', { count: 'exact' }),
        _sb().from('pending_registrations').select('id', { count: 'exact' }).eq('status', 'pending')
      ]);

      const seniors      = seniorsRes.data       || [];
      const transactions = txnRes.data            || [];
      const pendingCount = registrationsRes.count || 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTxns = transactions.filter(
        t => new Date(t.timestamp) >= thirtyDaysAgo
      ).length;

      return {
        totalSeniors:   seniors.length,
        pendingRegs:    pendingCount,
        totalTxns:      transactions.length,
        recentTxns,
        seniors,
        transactions
      };
    } catch (e) { _err('getDashboardStats', e); return {}; }
  }

}; // end window.db

console.log('[LingapApu] db.js loaded – Supabase data layer ready');
