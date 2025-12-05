import React, { useState, useEffect } from 'react';
import TagsManager from './TagsManager';
import './FolderCard.css';

const ACCESS_TOKEN = process.env.REACT_APP_ACCESS_TOKEN;

const FolderCard = ({ folder, updateFolderTags, allTags }) => {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchFiles = async () => {
      setLoadingFiles(true);
      setErrorFiles(null);
      try {
        const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path: folder.path_lower || '', shared_link: { url: folder.link } })
        });
        if (!res.ok) {
          const err = await res.json().catch(()=>null);
          if (err?.error?.path?.['.tag'] === 'restricted_content') {
            throw new Error('This folder contains restricted content.');
          }
          throw new Error(res.statusText);
        }
        const data = await res.json();
        if (!mounted) return;
        setFiles(data.entries || []);
      } catch (e) {
        if (!mounted) return;
        setErrorFiles(e.message);
      } finally {
        if (mounted) setLoadingFiles(false);
      }
    };
    fetchFiles();
    return () => { mounted = false; };
  }, [folder.link, folder.path_lower]);

  return (
    <div className="folder-card">
      <h4 className="folder-name">{folder.name}</h4>
      <a className="folder-link" href={folder.link} target="_blank" rel="noreferrer">Open Folder</a>

      <TagsManager folderId={folder.id} updateFolderTags={updateFolderTags} allTags={allTags} />

      <div className="folder-files">
        <h5>Files</h5>
        {loadingFiles && <p>Loading files...</p>}
        {errorFiles && <p className="error">{errorFiles}</p>}
        {!loadingFiles && !errorFiles && files.length === 0 && <p>No files</p>}
        <ul>
          {files.map(f => <li key={f.id}>{f.name} {f['.tag'] === 'folder' ? '(Folder)' : ''}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default FolderCard;
