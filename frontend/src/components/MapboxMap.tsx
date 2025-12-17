import { useState, useEffect, useRef, useCallback } from 'react';
import MapComponent, { Source, Layer, Popup } from 'react-map-gl/mapbox';
import type { MapRef, FillLayerSpecification } from 'react-map-gl/mapbox';
import { api } from '../services/api';
import 'mapbox-gl/dist/mapbox-gl.css';

interface WardSentiment {
  ward_id: number;
  ward_name: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  average_score: number;
  geometry: any;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapboxMap = () => {
  const mapRef = useRef<MapRef>(null);
  const [wardData, setWardData] = useState<WardSentiment[]>([]);
  const [popupInfo, setPopupInfo] = useState<{ longitude: number; latitude: number; ward: WardSentiment } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sentiment by ward
        const sentimentResponse = await api.getSentimentByWard();
        const wardsResponse = await api.getWards();

        if (sentimentResponse.success && wardsResponse.success && wardsResponse.data) {
          const sentimentMap = new Map<number, any>(
            (sentimentResponse.data || []).map((s: any) => [s.ward_id, s])
          );

          const combined = wardsResponse.data.map((ward) => {
            const sentiment = sentimentMap.get(ward.id) || {
              positive: 0,
              neutral: 0,
              negative: 0,
              total: 0,
              average_score: 0,
            };

            return {
              ward_id: ward.id,
              ward_name: ward.name,
              ...sentiment,
              geometry: ward.geom,
            };
          });

          setWardData(combined);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (sentiment: WardSentiment): string => {
    if (sentiment.total === 0) return '#94a3b8'; // gray for no data

    const positiveRatio = sentiment.positive / sentiment.total;
    const negativeRatio = sentiment.negative / sentiment.total;

    // More positive than negative
    if (positiveRatio > negativeRatio && positiveRatio > 0.4) {
      return '#10b981'; // green
    }
    // More negative than positive
    if (negativeRatio > positiveRatio && negativeRatio > 0.4) {
      return '#ef4444'; // red
    }
    // Neutral or mixed
    return '#f59e0b'; // yellow
  };

  const geojsonData = {
    type: 'FeatureCollection',
    features: wardData.map((ward) => ({
      type: 'Feature',
      id: ward.ward_id,
      properties: {
        ...ward,
        color: getSentimentColor(ward),
      },
      geometry: ward.geometry,
    })),
  };

  const fillLayer: FillLayerSpecification = {
    id: 'ward-fill',
    type: 'fill',
    source: 'wards',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.6,
    },
  };

  const outlineLayer: any = {
    id: 'ward-outline',
    type: 'line',
    paint: {
      'line-color': '#ffffff',
      'line-width': 2,
    },
  };

  const onClick = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature) {
      const ward = wardData.find((w) => w.ward_id === feature.id);
      if (ward) {
        // Calculate centroid for popup
        const coords = event.lngLat;
        setPopupInfo({
          longitude: coords.lng,
          latitude: coords.lat,
          ward,
        });
      }
    }
  }, [wardData]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full bg-yellow-50 rounded-lg shadow flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-yellow-600 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Mapbox Token Required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please set the <code className="bg-gray-200 px-2 py-1 rounded">VITE_MAPBOX_TOKEN</code> environment variable to enable the map.
          </p>
          <p className="text-xs text-gray-500">
            Get a free token at{' '}
            <a
              href="https://www.mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-100 rounded-lg shadow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-red-50 rounded-lg shadow flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Map</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg overflow-hidden shadow-lg relative">
      <MapComponent
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: -77.0369,
          latitude: 38.9072,
          zoom: 10,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactiveLayerIds={['ward-fill']}
        onClick={onClick}
      >
        {wardData.length > 0 && (
          <Source id="wards" type="geojson" data={geojsonData as any}>
            <Layer {...fillLayer} />
            <Layer {...outlineLayer} />
          </Source>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-2">{popupInfo.ward.ward_name}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Signals:</span>
                  <span className="font-semibold">{popupInfo.ward.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Positive:</span>
                  <span className="font-semibold">{popupInfo.ward.positive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Neutral:</span>
                  <span className="font-semibold">{popupInfo.ward.neutral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Negative:</span>
                  <span className="font-semibold">{popupInfo.ward.negative}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Score:</span>
                    <span className={`font-semibold ${
                      popupInfo.ward.average_score > 0.3 ? 'text-green-600' :
                      popupInfo.ward.average_score < -0.3 ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {popupInfo.ward.average_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </MapComponent>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Sentiment</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span>Neutral/Mixed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;
