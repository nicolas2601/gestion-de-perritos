// =============================================
// SUPABASE CLIENT + CRUD - Guardería Canina TIKNO
// =============================================

const SupabaseClient = (() => {
  let client = null;

  function init() {
    client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    return client;
  }

  function getClient() {
    if (!client) init();
    return client;
  }

  // ---- OWNERS ----
  async function getOwners() {
    const { data, error } = await getClient()
      .from('owners')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  }

  async function getOwner(id) {
    const { data, error } = await getClient()
      .from('owners')
      .select('*, dogs(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function createOwner(owner) {
    const { data, error } = await getClient()
      .from('owners')
      .insert(owner)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateOwner(id, updates) {
    const { data, error } = await getClient()
      .from('owners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ---- DOGS ----
  async function getDogs() {
    const { data, error } = await getClient()
      .from('dogs')
      .select('*, owners(name, phone)')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  }

  async function getDog(id) {
    const { data, error } = await getClient()
      .from('dogs')
      .select('*, owners(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function createDog(dog) {
    const { data, error } = await getClient()
      .from('dogs')
      .insert(dog)
      .select('*, owners(name, phone)')
      .single();
    if (error) throw error;
    return data;
  }

  async function updateDog(id, updates) {
    const { data, error } = await getClient()
      .from('dogs')
      .update(updates)
      .eq('id', id)
      .select('*, owners(name, phone)')
      .single();
    if (error) throw error;
    return data;
  }

  async function searchDogs(query) {
    const { data, error } = await getClient()
      .from('dogs')
      .select('*, owners(name, phone)')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,breed.ilike.%${query}%`)
      .order('name');
    if (error) throw error;
    return data;
  }

  // ---- CHECKINS ----
  async function getActiveCheckins() {
    const { data, error } = await getClient()
      .from('checkins')
      .select('*, dogs(*, owners(name, phone))')
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function checkIn(dogId, notes = '') {
    const { data, error } = await getClient()
      .from('checkins')
      .insert({
        dog_id: dogId,
        check_in_time: new Date().toISOString(),
        status: 'en_patio',
        notes
      })
      .select('*, dogs(*, owners(name, phone))')
      .single();
    if (error) throw error;
    return data;
  }

  async function checkOut(checkinId) {
    const { data, error } = await getClient()
      .from('checkins')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', checkinId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateCheckinStatus(checkinId, status) {
    const { data, error } = await getClient()
      .from('checkins')
      .update({ status })
      .eq('id', checkinId)
      .select('*, dogs(*, owners(name, phone))')
      .single();
    if (error) throw error;
    return data;
  }

  async function getDogHistory(dogId) {
    const { data, error } = await getClient()
      .from('checkins')
      .select('*')
      .eq('dog_id', dogId)
      .order('check_in_time', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  }

  async function getDogVisitCount(dogId) {
    const { count, error } = await getClient()
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('dog_id', dogId);
    if (error) throw error;
    return count;
  }

  async function getTodayCheckins() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await getClient()
      .from('checkins')
      .select('*, dogs(name)')
      .gte('check_in_time', today.toISOString())
      .order('check_in_time', { ascending: false });
    if (error) throw error;
    return data;
  }

  // ---- PHOTOS ----
  async function uploadPhoto(file, dogId) {
    const ext = file.name.split('.').pop();
    const fileName = `${dogId}_${Date.now()}.${ext}`;
    const { data, error } = await getClient().storage
      .from(CONFIG.STORAGE_BUCKET)
      .upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = getClient().storage
      .from(CONFIG.STORAGE_BUCKET)
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  // ---- STATS ----
  async function getDashboardStats() {
    const [activeCheckins, allDogs, todayCheckins] = await Promise.all([
      getActiveCheckins(),
      getDogs(),
      getTodayCheckins()
    ]);

    const checkedOutToday = todayCheckins.filter(c => c.check_out_time).length;

    return {
      activeNow: activeCheckins.length,
      totalDogs: allDogs.length,
      todayVisits: todayCheckins.length,
      checkedOutToday
    };
  }

  return {
    init, getClient,
    getOwners, getOwner, createOwner, updateOwner,
    getDogs, getDog, createDog, updateDog, searchDogs,
    getActiveCheckins, checkIn, checkOut, updateCheckinStatus,
    getDogHistory, getDogVisitCount, getTodayCheckins,
    uploadPhoto, getDashboardStats
  };
})();
