import React, { useState, useEffect } from "react";
import TagsManager from "./TagsManager";
import "./FolderCard.css";

const ACCESS_TOKEN = process.env.REACT_APP_ACCESS_TOKEN;

const FolderCard = ({ folder, updateFolderTags, allTags }) => {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState(null);

  // Fetch files inside this folder
  useEffect(() => {
    const fetchFiles = async () => {
      setLoadingFiles(true);
      setErrorFiles(null);

      try {
        const response = await fetch(
          "https://api.dropboxapi.com/2/files/list_folder",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: "",
              shared_link: { url: folder.link },
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          if (
            errData?.error?.path?.[".tag"] === "restricted_content"
          ) {
            throw new Error("This folder contains restricted content.");
          } else {
            throw new Error(`Dropbox API error: ${response.statusText}`);
          }
        }

        const data = await response.json();
        setFiles(data.entries || []);
      } catch (err) {
        setErrorFiles(err.message);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [folder.link]);

  return (
    <div className="folder-card">
      <h4 className="folder-name">{folder.name}</h4>
      <a
        className="folder-link"
        href={folder.link}
        target="_blank"
        rel="noreferrer"
      >
        Open Dropbox Folder
      </a>

      <TagsManager
        folderId={folder.id}
        updateFolderTags={updateFolderTags}
        allTags={allTags}
      />

      <div className="folder-files">
        <h5>Files:</h5>
        {loadingFiles && <p>Loading files...</p>}
        {errorFiles && <p className="error">{errorFiles}</p>}
        {!loadingFiles && !errorFiles && files.length === 0 && (
          <p>No files found</p>
        )}
        <ul>
          {files.map(file => (
            <li key={file.id}>
              {file.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FolderCard;
