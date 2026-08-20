import React from 'react';
import { Box, Typography } from '@mui/material';

export interface BoraLogoSVGProps {
  size?: number;
}

export const BoraLogoSVG: React.FC<BoraLogoSVGProps> = ({ size = 200 }) => {
  return (
    <Box 
      sx={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))',
        userSelect: 'none'
      }}
    >
      {/* Texto Bora! 3D com Contorno Amarelo e Azul Idêntico ao Figma */}
      <Box position="relative" mb={0.5}>
        <Typography
          sx={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: '3.8rem',
            fontWeight: 900,
            lineHeight: 1,
            color: '#FFFFFF',
            letterSpacing: '-1px',
            WebkitTextStroke: '6px #FFD700', // Borda Amarela Externa do Figma
            paintOrder: 'stroke fill',
            textShadow: '0 6px 0 #0047B3, 0 10px 0 #003380, 0 12px 16px rgba(0,0,0,0.3)',
          }}
        >
          Bora!
        </Typography>
      </Box>

      {/* Ícones Esportivos do Logo Vetorizados (Bolas, Mapa e Luva de Goleiro) */}
      <Box display="flex" alignItems="center" gap={1.2} mt={-0.5}>
        {/* Bola de Basquete/Vôlei */}
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            bgcolor: '#FFFFFF',
            border: '3.5px solid #FFD700',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
          </svg>
        </Box>

        {/* Mapa de Localização */}
        <Box
          sx={{
            width: 44,
            height: 36,
            borderRadius: '8px',
            bgcolor: '#FFFFFF',
            border: '3.5px solid #FFD700',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.5
          }}
        >
          <svg width="34" height="26" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
        </Box>

        {/* Luva / Mão Esportiva */}
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: '#FFFFFF',
            border: '3.5px solid #FFD700',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
        </Box>
      </Box>
    </Box>
  );
};
