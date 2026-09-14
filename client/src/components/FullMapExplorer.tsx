import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Card, Typography, Button, Chip } from '@mui/material';
import { GoogleMap, MarkerF, CircleF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';

export interface FullMapExplorerProps {
  partidas: any[];
  centroLat?: number;
  centroLng?: number;
  raioKm?: number;
  onSolicitarVaga?: (id: string) => void;
  onMarcarAmistoso?: (id: string) => void;
}

// Ícones personalizados para cada modalidade esportiva em Franca (Leaflet)
const criarIconeEsporteLeaflet = (esporte: string = '', isAmistoso: boolean = false) => {
  const cor = isAmistoso ? '#0066FF' : '#16A34A';
  const esp = String(esporte || '');
  const emoji = esp.includes('Basquete') ? '🏀' 
    : esp.includes('Vôlei') || esp.includes('Futevôlei') ? '🏐'
    : esp.includes('Beach Tennis') ? '🎾'
    : '⚽';

  const html = `
    <div style="
      background-color: ${cor};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      cursor: pointer;
      transform: translate(-18px, -18px);
    ">
      ${emoji}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-bora-map-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

export const FullMapExplorer: React.FC<FullMapExplorerProps> = ({
  partidas,
  centroLat = -20.5388,
  centroLng = -47.4005,
  raioKm = 15,
  onSolicitarVaga,
  onMarcarAmistoso,
}) => {
  const googleMapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const usarGoogleMaps = Boolean(googleMapsApiKey);

  const { isLoaded: googleMapsLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-explorer',
    googleMapsApiKey: googleMapsApiKey,
  });

  const [partidaSelecionadaGoogle, setPartidaSelecionadaGoogle] = useState<any | null>(null);

  // Refs para Leaflet Fallback
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Inicializa o mapa Leaflet quando não usar Google Maps
  useEffect(() => {
    if (usarGoogleMaps && !loadError) return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centroLat, centroLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const circle = L.circle([centroLat, centroLng], {
        radius: raioKm * 1000,
        color: '#0066FF',
        fillColor: '#0066FF',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      circleRef.current = circle;
      markersLayerRef.current = markersGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [usarGoogleMaps, loadError]);

  // 2. Atualiza centro e raio no Leaflet
  useEffect(() => {
    if (usarGoogleMaps && !loadError) return;
    if (mapInstanceRef.current && circleRef.current) {
      circleRef.current.setLatLng([centroLat, centroLng]);
      circleRef.current.setRadius(raioKm * 1000);
    }
  }, [centroLat, centroLng, raioKm, usarGoogleMaps, loadError]);

  // 3. Atualiza os marcadores de partidas no Leaflet
  useEffect(() => {
    if (usarGoogleMaps && !loadError) return;
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    partidas.forEach((match) => {
      const isAmistoso = match.formatoJogo === 'Amistoso_Times';
      const lat = Number(match.lat);
      const lng = Number(match.lng);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: criarIconeEsporteLeaflet(match.esporte, isAmistoso),
      });

      const popupHtml = `
        <div style="font-family: Poppins, sans-serif; min-width: 190px; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; color: #0066FF; font-size: 14px; font-weight: 800;">${match.esporte}</h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748B;">📍 ${match.bairro}, Franca/SP</p>
          <div style="margin-bottom: 8px;">
            <span style="background: ${isAmistoso ? '#EFF6FF' : '#DCFCE7'}; color: ${isAmistoso ? '#0066FF' : '#166534'}; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">
              ${isAmistoso ? `⚔️ ${match.timeMandante || 'Time de Franca'}` : `${match.vagasPreenchidas}/${match.maxVagas} Vagas`}
            </span>
          </div>
          <button id="btn-popup-${match.id}" style="width: 100%; background: #0066FF; color: #fff; border: none; padding: 7px; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 12px;">
            ${isAmistoso ? 'Desafiar Amistoso' : 'Solicitar Vaga'}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${match.id}`);
        if (btn) {
          btn.onclick = () => {
            if (isAmistoso) {
              onMarcarAmistoso && onMarcarAmistoso(match.id);
            } else {
              onSolicitarVaga && onSolicitarVaga(match.id);
            }
          };
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [partidas, onSolicitarVaga, onMarcarAmistoso, usarGoogleMaps, loadError]);

  return (
    <Card 
      sx={{ 
        width: '100%', 
        height: 480, 
        borderRadius: 3.5, 
        overflow: 'hidden', 
        border: '1.5px solid #0066FF',
        boxShadow: '0 4px 20px rgba(0,102,255,0.15)',
        position: 'relative'
      }}
    >
      {/* Badge de Provedor do Mapa */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(6px)',
          px: 1.2,
          py: 0.4,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        <Chip
          size="small"
          label={usarGoogleMaps && googleMapsLoaded && !loadError ? 'Google Maps Platform' : 'Leaflet / OpenStreetMap'}
          sx={{
            fontWeight: 800,
            fontSize: '0.68rem',
            bgcolor: usarGoogleMaps && googleMapsLoaded && !loadError ? '#E0E7FF' : '#DCFCE7',
            color: usarGoogleMaps && googleMapsLoaded && !loadError ? '#3730A3' : '#166534',
            height: 22
          }}
        />
      </Box>

      {/* Renderização Híbrida: Google Maps ou Leaflet */}
      {usarGoogleMaps && googleMapsLoaded && !loadError ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: centroLat, lng: centroLng }}
          zoom={13}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Círculo do Raio de Busca Geoespacial */}
          <CircleF
            center={{ lat: centroLat, lng: centroLng }}
            radius={raioKm * 1000}
            options={{
              strokeColor: '#0066FF',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#0066FF',
              fillOpacity: 0.08,
            }}
          />

          {/* Marcadores de Partidas no Google Maps */}
          {partidas.map((match) => {
            const lat = Number(match.lat);
            const lng = Number(match.lng);
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

            return (
              <MarkerF
                key={match.id}
                position={{ lat, lng }}
                title={`${match.esporte} - ${match.bairro}`}
                onClick={() => setPartidaSelecionadaGoogle(match)}
              />
            );
          })}

          {/* InfoWindow interativo para a partida selecionada no Google Maps */}
          {partidaSelecionadaGoogle && (
            <InfoWindowF
              position={{
                lat: Number(partidaSelecionadaGoogle.lat),
                lng: Number(partidaSelecionadaGoogle.lng)
              }}
              onCloseClick={() => setPartidaSelecionadaGoogle(null)}
            >
              <Box sx={{ p: 1, minWidth: 180, fontFamily: 'Poppins, sans-serif' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0066FF', mb: 0.3 }}>
                  {partidaSelecionadaGoogle.esporte}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  📍 {partidaSelecionadaGoogle.bairro}, Franca/SP
                </Typography>
                <Box sx={{ mb: 1.2 }}>
                  <Chip
                    size="small"
                    label={
                      partidaSelecionadaGoogle.formatoJogo === 'Amistoso_Times'
                        ? `⚔️ ${partidaSelecionadaGoogle.timeMandante || 'Time de Franca'}`
                        : `${partidaSelecionadaGoogle.vagasPreenchidas}/${partidaSelecionadaGoogle.maxVagas} Vagas`
                    }
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      bgcolor: partidaSelecionadaGoogle.formatoJogo === 'Amistoso_Times' ? '#EFF6FF' : '#DCFCE7',
                      color: partidaSelecionadaGoogle.formatoJogo === 'Amistoso_Times' ? '#0066FF' : '#166534',
                      height: 22
                    }}
                  />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => {
                    if (partidaSelecionadaGoogle.formatoJogo === 'Amistoso_Times') {
                      onMarcarAmistoso && onMarcarAmistoso(partidaSelecionadaGoogle.id);
                    } else {
                      onSolicitarVaga && onSolicitarVaga(partidaSelecionadaGoogle.id);
                    }
                    setPartidaSelecionadaGoogle(null);
                  }}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    borderRadius: 1.5,
                    bgcolor: '#0066FF',
                    textTransform: 'none'
                  }}
                >
                  {partidaSelecionadaGoogle.formatoJogo === 'Amistoso_Times' ? 'Desafiar Amistoso' : 'Solicitar Vaga'}
                </Button>
              </Box>
            </InfoWindowF>
          )}
        </GoogleMap>
      ) : (
        <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />
      )}
    </Card>
  );
};

export default FullMapExplorer;
