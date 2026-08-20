import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Card } from '@mui/material';

export interface FullMapExplorerProps {
  partidas: any[];
  centroLat?: number;
  centroLng?: number;
  raioKm?: number;
  onSolicitarVaga?: (id: string) => void;
  onMarcarAmistoso?: (id: string) => void;
}

// Ícones personalizados para cada modalidade esportiva em Franca
const criarIconeEsporte = (esporte: string, isAmistoso: boolean) => {
  const cor = isAmistoso ? '#0066FF' : '#16A34A';
  const emoji = esporte.includes('Basquete') ? '🏀' 
    : esporte.includes('Vôlei') || esporte.includes('Futevôlei') ? '🏐'
    : esporte.includes('Beach Tennis') ? '🎾'
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Inicializa o mapa
  useEffect(() => {
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
  }, []);

  // 2. Atualiza centro e raio
  useEffect(() => {
    if (mapInstanceRef.current && circleRef.current) {
      circleRef.current.setLatLng([centroLat, centroLng]);
      circleRef.current.setRadius(raioKm * 1000);
    }
  }, [centroLat, centroLng, raioKm]);

  // 3. Atualiza os marcadores de partidas
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    partidas.forEach((match) => {
      const isAmistoso = match.formatoJogo === 'Amistoso_Times';
      const lat = Number(match.lat);
      const lng = Number(match.lng);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: criarIconeEsporte(match.esporte, isAmistoso),
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
  }, [partidas, onSolicitarVaga, onMarcarAmistoso]);

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
      <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />
    </Card>
  );
};

export default FullMapExplorer;
