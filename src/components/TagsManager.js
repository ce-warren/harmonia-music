import React, { useState, useEffect, useRef } from "react";
import "./TagsManager.css";

const API_BASE = "/api";

const TagsManager = ({ folderId, updateFolderTags, allTags }) => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch tags once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchTags = async () => {
      try {
        const res = await fetch(`${API_BASE}/tags/${folderId}`);
        if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        setTags(data.tags || []);
        // Removed updateFolderTags here to avoid infinite loop
      } catch (err) {
        console.error("Error fetching tags:", err);
        if (isMounted) setTags([]);
      }
    };

    fetchTags();
    return () => { isMounted = false; };
  }, [folderId]);

  const saveTags = (updatedTags) => {
    fetch(`${API_BASE}/tags/${folderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: updatedTags }),
    }).catch(err => console.error("Error saving tags:", err));

    updateFolderTags(folderId, updatedTags);
  };

  const addTag = (tagToAdd) => {
    const trimmedTag = tagToAdd.trim();
    if (!trimmedTag || tags.includes(trimmedTag)) return;
    const updated = [...tags, trimmedTag];
    setTags(updated);
    saveTags(updated);
    setNewTag("");
    setDropdownVisible(false);
  };

  const removeTag = (index) => {
    const updated = tags.filter((_, i) => i !== index);
    setTags(updated);
    saveTags(updated);
  };

  const dropdownTags = allTags
    .filter(tag => !tags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(newTag.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="tags-container" ref={wrapperRef}>
      <ul className="tags-list">
        {tags.map((tag, index) => (
          <li key={tag} className="tag-item">
            {tag}
            <button className="remove-tag-btn" onClick={() => removeTag(index)}>x</button>
          </li>
        ))}
      </ul>

      <div className="tags-input" style={{ position: "relative" }}>
        <input
          type="text"
          value={newTag}
          onChange={e => {
            setNewTag(e.target.value);
            setDropdownVisible(true);
          }}
          placeholder="Add tag"
          onFocus={() => setDropdownVisible(true)}
        />
        <button className="add-tag-btn" onMouseDown={() => addTag(newTag)}>Add</button>

        {dropdownVisible && dropdownTags.length > 0 && (
          <ul className="tags-dropdown">
            {dropdownTags.map(tag => (
              <li key={tag} onMouseDown={() => addTag(tag)}>
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TagsManager;
