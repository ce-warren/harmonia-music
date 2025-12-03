import React, { useState, useEffect } from "react";
import FolderCard from "./components/FolderCard";
import "./App.css";

const ACCESS_TOKEN = process.env.REACT_APP_ACCESS_TOKEN;
const SHARED_LINK = process.env.REACT_APP_SHARED_LINK; // e.g. https://www.dropbox.com/scl/fo/...
const SHARED_BASE = SHARED_LINK.split("?")[0]; // remove query string
const API_BASE = "/api";

const App = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Read tags from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagsParam = params.get("tags");
    if (tagsParam) {
      const initialTags = tagsParam.split(",").map(tag => decodeURIComponent(tag.trim()));
      setSelectedTags(initialTags);
    }
  }, []);

  // Fetch folders from Dropbox
  const fetchFolders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "",
          shared_link: { url: SHARED_LINK },
        }),
      });

      if (!response.ok) throw new Error(`Dropbox API error: ${response.statusText}`);
      const data = await response.json();
      const foldersOnly = data.entries.filter(entry => entry[".tag"] === "folder");

      // Fetch backend tags for each folder
      const foldersWithTags = await Promise.all(
        foldersOnly.map(async folder => {
          try {
            const res = await fetch(`${API_BASE}/tags/${folder.id}`);
            const json = await res.json();
            return {
              ...folder,
              tags: json.tags || [],
              link: `${SHARED_BASE}/${encodeURIComponent(folder.name)}?e=1&dl=0`,
            };
          } catch {
            return {
              ...folder,
              tags: [],
              link: `${SHARED_BASE}/${encodeURIComponent(folder.name)}?e=1&dl=0`,
            };
          }
        })
      );

      setFolders(foldersWithTags);

      // Collect all unique tags for filter
      const allTagsSet = new Set(foldersWithTags.flatMap(f => f.tags));
      setAllTags(Array.from(allTagsSet).sort());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch folders once on mount
  useEffect(() => {
    fetchFolders();
  }, []);

  // Update tags for a folder
  const updateFolderTags = (folderId, tags) => {
    setFolders(prev =>
      prev.map(folder => folder.id === folderId ? { ...folder, tags } : folder)
    );
    setAllTags(prevAllTags => Array.from(new Set([...prevAllTags, ...tags])).sort());
  };

  // Handle tag filter selection
  const handleTagSelection = (tag) => {
    setSelectedTags(prev => {
      const updated = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];

      const params = new URLSearchParams();
      if (updated.length > 0) {
        params.set("tags", updated.map(encodeURIComponent).join(","));
      } else {
        params.delete("tags");
      }
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);

      return updated;
    });
  };

  // Filter folders by name and selected tags
  const filteredFolders = folders.filter(folder => {
    const matchesName = folder.name.toLowerCase().includes(searchText.toLowerCase());
    if (selectedTags.length === 0) return matchesName;
    return matchesName && selectedTags.every(tag => folder.tags.includes(tag));
  });

  return (
    <div className="app-container">
      <h1>Harmonia Music Library</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search music by name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <button onClick={fetchFolders} disabled={loading}>
          {loading ? "Loading..." : "Search music"}
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter">
          <span>Filter by tags:</span>
          <div className="tag-options">
            {allTags.map(tag => (
              <button
                key={tag}
                className={selectedTags.includes(tag) ? "tag-selected" : ""}
                onClick={() => handleTagSelection(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="folders-list">
        {filteredFolders.map(folder => (
          <FolderCard
            key={folder.id}
            folder={folder}
            updateFolderTags={updateFolderTags}
            allTags={allTags}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
