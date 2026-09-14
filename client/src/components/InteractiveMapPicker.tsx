import React, { useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { MapPin, Hand } from 'lucide-react';
import L from 'leaflet';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

export interface InteractiveMapPickerProps {
  lat: number;
  lng: number;
  label?: string;
  origemTexto?: string;
  buscando?: boolean;
  onChangeCoordinates: (lat: number, lng: number) => void;
}

// Ícone SVG customizado com estilo oficial Bora! App (Azul / Dourado / Alfinete 3D) para Leaflet
const criarIconeAlfinete = () => {
  return L.divIcon({
    className: 'custom-bora-pin',
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-19px, -36px);
        cursor: grab;
      ">
        <div style="
          width: 34px;
          height: 34px;
          background: #0066FF;
          border: 3px solid #FFD700;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,102,255,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: #FFFFFF;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
  });
};

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  lat,
  lng,
  label,
  origemTexto = '📍 Base Franca/SP',
  buscando = false,
  onChangeCoordinates,
}) => {
  const googleMapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const usarGoogleMaps = Boolean(googleMapsApiKey);

  // Hook oficial da Google Maps API
  const { isLoaded: googleMapsLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-picker',
    googleMapsApiKey: googleMapsApiKey,
  });

  // Refs para Fallback Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Inicialização do Mapa Leaflet (apenas quando não utilizar Google Maps)
  useEffect(() => {
    if (usarGoogleMaps && !loadError) return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], {
        icon: criarIconeAlfinete(),
        draggable: true,
        autoPan: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeCoordinates(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        map.panTo(e.latlng, { animate: true, duration: 0.5 });
        onChangeCoordinates(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [usarGoogleMaps, loadError]);

  // Atualização de coordenadas no Leaflet caso mudem externamente
  useEffect(() => {
    if (usarGoogleMaps && !loadError) return;
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      const mudouSignificativo =
        Math.abs(currentPos.lat - lat) > 0.00005 || Math.abs(currentPos.lng - lng) > 0.00005;

      if (mudouSignificativo) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
      }
    }
  }, [lat, lng, usarGoogleMaps, loadError]);

  const handleGoogleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onChangeCoordinates(e.latLng.lat(), e.latLng.lng());
    }
  }, [onChangeCoordinates]);

  const handleGoogleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onChangeCoordinates(e.latLng.lat(), e.latLng.lng());
    }
  }, [onChangeCoordinates]);

  return (
    <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid #0066FF', bgcolor: '#F8FAFC' }}>
      {/* Header do Minimapa com Status da Origem e Provedor */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#EFF6FF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #BFDBFE',
        }}
      >
        <Box display="flex" alignItems="center" gap={0.8}>
          <MapPin size={16} color="#0066FF" />
          <Typography variant="caption" fontWeight={900} color="primary.main">
            COORDENADAS: ({lat.toFixed(5)}, {lng.toFixed(5)})
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.8}>
          <Chip
            size="small"
            label={usarGoogleMaps && googleMapsLoaded && !loadError ? 'Google Maps API' : 'Leaflet / OSM'}
            sx={{
              fontWeight: 800,
              fontSize: '0.65rem',
              bgcolor: usarGoogleMaps && googleMapsLoaded && !loadError ? '#E0E7FF' : '#F1F5F9',
              color: usarGoogleMaps && googleMapsLoaded && !loadError ? '#3730A3' : '#475569',
              height: 20
            }}
          />
          <Chip
            size="small"
            label={buscando ? 'Buscando Coordenadas...' : origemTexto}
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: buscando ? '#FEF3C7' : '#DCFCE7',
              color: buscando ? '#92400E' : '#166534',
              height: 20
            }}
          />
        </Box>
      </Box>

      {/* Renderização Híbrida: Google Maps ou Leaflet */}
      {usarGoogleMaps && googleMapsLoaded && !loadError ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '180px' }}
          center={{ lat, lng }}
          zoom={16}
          onClick={handleGoogleMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          <MarkerF
            position={{ lat, lng }}
            draggable={true}
            onDragEnd={handleGoogleMarkerDragEnd}
            title={label || 'Local da Partida'}
          />
        </GoogleMap>
      ) : (
        <Box
          ref={mapContainerRef}
          sx={{
            width: '100%',
            height: 180,
            bgcolor: '#E2E8F0',
            cursor: 'crosshair',
            '& .leaflet-container': {
              width: '100%',
              height: '100%',
              fontFamily: 'inherit',
            },
          }}
        />
      )}

      {/* Rodapé com Dica de Arraste e Endereço */}
      <Box
        sx={{
          p: 1,
          px: 1.5,
          bgcolor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Hand size={14} color="#0066FF" />
          {label ? `Alfinete: ${label}` : 'Clique ou arraste o alfinete para o local exato do jogo'}
        </Typography>
        <Typography variant="caption" color="primary.main" fontWeight={800}>
          🖐️ Alfinete Arrastável
        </Typography>
      </Box>
    </Box>
  );
};
