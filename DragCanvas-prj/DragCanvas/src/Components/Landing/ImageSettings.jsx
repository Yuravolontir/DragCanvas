  import React, { useState, useRef } from 'react';
  import { useNode } from '@craftjs/core';
  import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
  import { ToolbarHelp } from './Toolbar/ToolbarHelp';
  import { apiFetch, getToken } from '../../api.js';

  export const ImageSettings = () => {
    const { actions: { setProp } } = useNode();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Send the picked file to our server, which stores it in Cloudinary
    // and returns a public URL we can use as the image src.
    const handleFileChange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const asset = await apiFetch('/api/assets/upload', { method: 'POST', body: formData });
        setProp((props) => { props.src = asset.Url; });
      } catch (error) {
        setUploadError(error.message);
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    };

    return (
      <React.Fragment>
        <ToolbarHelp title="Picture" icon="image">
          Paste a link to a picture, or upload one from your computer. Drag the
          corner handles on the canvas to resize it — on phones it shrinks to
          fit the screen by itself.
        </ToolbarHelp>
        <ToolbarSection title="Content">
            <ToolbarItem full={true} propKey="src" type="text" label="Image URL" />
            <ToolbarItem
          full={true}
          propKey="radius"
          type="slider"
          label="Radius"
          max={100}
        />
        </ToolbarSection>

        <ToolbarSection title="Upload">
          <div style={{ padding: '0 8px 8px', width: '100%' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !getToken()}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: uploading ? '#eee' : '#fff',
                cursor: uploading ? 'default' : 'pointer',
              }}
            >
              {uploading ? 'Uploading…' : 'Upload from computer'}
            </button>

            {!getToken() && (
              <small style={{ display: 'block', marginTop: 4, color: '#888' }}>
                Sign in to upload your own images
              </small>
            )}
            {uploadError && (
              <small style={{ display: 'block', marginTop: 4, color: '#c00' }}>
                {uploadError}
              </small>
            )}
          </div>
        </ToolbarSection>
      </React.Fragment>
    );
  };
