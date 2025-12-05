import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const { data, error } = await supabase.from('folder_tags').select('tags');
  if (error) return res.status(500).json({ error: 'Failed' });
  const all = [].concat(...(data.map(r => r.tags || [])));
  const unique = Array.from(new Set(all));
  res.status(200).json(unique);
}
