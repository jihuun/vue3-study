import supabase from '../supabase';

export async function addSearchHistory(query) {
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) return
  console.log("add history:", query);
  console.log(user.user.id);

  const { error } = await supabase
    .from('search_history')
    .insert({
      user_id: user.user.id,
      query,
    })

  if (error) console.error(error)
}

export async function getSearchHistory(limit = 100) {
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) return []

  const { data, error } = await supabase
    .from('search_history')
    .select('query, created_at')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(error)
    return []
  }

  return data
}