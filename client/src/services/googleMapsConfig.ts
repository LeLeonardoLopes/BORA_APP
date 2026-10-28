import type { Libraries } from '@react-google-maps/api';

/**
 * Configuração única do carregamento do Google Maps.
 * O @react-google-maps/api exige que TODOS os componentes usem exatamente as mesmas
 * opções (id, chave e bibliotecas); senão lança "Loader must not be called again with different options".
 */
export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

export const GOOGLE_MAPS_LIBRARIES: Libraries = [];

export const GOOGLE_MAPS_LOADER_ID = 'bora-google-maps-script';
