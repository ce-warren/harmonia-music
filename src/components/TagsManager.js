import React, { useState, useEffect, useRef } from 'react';
import './TagsManager.css';

const API_BASE = '/api';

const TagsManager = ({ folderId, updateFolderTags, allTags }) => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchTags = async () => {
      try {
        const res = await fetch(`${API_BASE}/tags?folderId=${encodeURIComponent(folderId)}`);
        if (!res.ok) throw new Error('Failed to load tags');
        const data = await res.json();
        if (!mounted) return;
        setTags(data.tags || []);
        // Do not call updateFolderTags here to avoid loops
      } catch (e) {
        if (!mounted) return;
        setTags([]);
      }
    };
    fetchTags();
    return () => { mounted = false; };
  }, [folderId]);

  const saveTags = (updated) => {
    setTags(updated);
    fetch(`${API_BASE}/tags?folderId=${encodeURIComponent(folderId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: updated })
    }).catch(()=>{});
    updateFolderTags(folderId, updated);
  };

  const addTag = (t) => {
    const trimmed = t.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const updated = [...tags, trimmed];
    saveTags(updated);
    setNewTag('');
    setDropdownVisible(false);
  };

  const removeTag = (idx) => {
    const updated = tags.filter((_,i)=>i!==idx);
    saveTags(updated);
  };

  const dropdownTags = (allTags || []).filter(tag => !tags.includes(tag)).filter(tag => tag.toLowerCase().includes(newTag.toLowerCase()));

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setDropdownVisible(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tags-container" ref={wrapperRef}>
      <ul className="tags-list">
        {tags.map((tag, i) => (
          <li key={tag} className="tag-item">{tag} <button onClick={()=>removeTag(i)}>x</button></li>
        ))}
      </ul>

      <div className="tags-input" style={{position:'relative'}}>
        <input value={newTag} placeholder="Add tag" onChange={e=>{setNewTag(e.target.value); setDropdownVisible(true);}} onFocus={()=>setDropdownVisible(true)} />
        <button onMouseDown={()=>addTag(newTag)}>Add</button>
        {dropdownVisible && dropdownTags.length>0 && (
          <ul className="tags-dropdown">
            {dropdownTags.map(t=> <li key={t} onMouseDown={()=>addTag(t)}>{t}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TagsManager;
