import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const folderId = req.query.folderId;
  if (!folderId) return res.status(400).json({ error: 'Missing folderId' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('folder_tags')
      .select('tags')
      .eq('folder_id', folderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch tags' });
    }
    return res.status(200).json({ tags: data?.tags ?? [] });
  }

  if (req.method === 'POST') {
    const { tags } = req.body;
    const { error } = await supabase
      .from('folder_tags')
      .upsert({ folder_id: folderId, tags: tags || [] });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to save tags' });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
