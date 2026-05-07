import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { Resizer } from './Resizer';
import { MapSettings } from './MapSettings';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix broken default marker icons in Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const Map = ({ lat, lng, zoom, height, label }) => {
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{
        width: '100%',
        display: 'block',
        overflow: 'hidden',
        borderRadius: '8px',
      }}
    >
      <div style={{
        height: height,
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          scrollWheelZoom={!enabled}
          dragging={!enabled}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            {label && <Popup>{label}</Popup>}
          </Marker>
        </MapContainer>
        {enabled && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,96,172,0.85)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            {label || `${lat}, ${lng}`}
          </div>
        )}
      </div>
    </Resizer>
  );
};

Map.craft = {
  displayName: 'Map',
  props: {
    lat: 32.3215,
    lng: 34.8532,
    zoom: 13,
    height: '300px',
    width: '100%',
    label: 'Netanya',
  },
  related: {
    toolbar: MapSettings,
  },
};
