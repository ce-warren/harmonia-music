import React, { useState, useEffect, useCallback } from 'react';
import FolderCard from './components/FolderCard';
import './App.css';

const ACCESS_TOKEN = process.env.REACT_APP_ACCESS_TOKEN;
const SHARED_LINK = process.env.REACT_APP_SHARED_LINK;
const API_BASE = "/api";

const App = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagsParam = params.get('tags');
    if (tagsParam) setSelectedTags(tagsParam.split(',').map(t => decodeURIComponent(t)));
  }, []);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: '', shared_link: { url: SHARED_LINK } })
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const foldersOnly = data.entries.filter(e => e['.tag'] === 'folder');
      const base = SHARED_LINK.split('?')[0];

      const foldersWithTags = await Promise.all(
        foldersOnly.map(async folder => {
          try {
            const tagRes = await fetch(`${API_BASE}/tags/${folder.id}`);
            const tagJson = await tagRes.json();
            return {
              ...folder,
              tags: tagJson.tags || [],
              link: `${base}/${encodeURIComponent(folder.name)}?e=1&dl=0`,
              files: []
            };
          } catch {
            return {
              ...folder,
              tags: [],
              link: `${base}/${encodeURIComponent(folder.name)}?e=1&dl=0`,
              files: []
            };
          }
        })
      );

      setFolders(foldersWithTags);
      setAllTags(Array.from(new Set(foldersWithTags.flatMap(f => f.tags))).sort());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const updateFolderTags = useCallback((folderId, tags) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, tags } : f));
    setAllTags(prev => Array.from(new Set([...prev, ...tags])).sort());
  }, []);

  const handleTagSelection = (tag) => {
    setSelectedTags(prev => {
      const updated = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      const params = new URLSearchParams();
      if (updated.length) params.set('tags', updated.map(encodeURIComponent).join(','));
      else params.delete('tags');
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      return updated;
    });
  };

  const filtered = folders.filter(folder => {
    const matches = folder.name.toLowerCase().includes(searchText.toLowerCase());
    if (!selectedTags.length) return matches;
    return matches && selectedTags.every(tag => folder.tags.includes(tag));
  });

  return (
    <div className="app-container">
      <h1>Harmonia — Dropbox folders</h1>

      <div className="search-bar">
        <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search folders..." />
        <button onClick={fetchFolders} disabled={loading}>{loading ? 'Loading...' : 'Load Folders'}</button>
      </div>

      <div className="tag-filter">
        <span>Filter by tags:</span>
        <div className="tag-options">
          {allTags.map(tag => (
            <button key={tag} className={selectedTags.includes(tag) ? 'tag-selected' : ''} onClick={() => handleTagSelection(tag)}>{tag}</button>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="folders-list">
        {filtered.map(folder => (
          <FolderCard key={folder.id} folder={folder} updateFolderTags={updateFolderTags} allTags={allTags} />
        ))}
      </div>
    </div>
  );
};

export default App;
