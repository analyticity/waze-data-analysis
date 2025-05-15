import React, { useContext, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, Polyline } from 'react-leaflet';
import L, { Map as LeafletMap, icon } from 'leaflet';
import { dataContext, filterContext, routeContext, streetContext } from '../utils/contexts';
import { useTranslation } from 'react-i18next';
import { NotificationInstance } from 'antd/es/notification/interface';
import { LoadingOutlined } from '@ant-design/icons';
import { StreetInMap } from '../types/StreetInMap';
import { drawOnMap } from '../utils/map';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { AdressPoint, Coord } from '../types/baseTypes';
import dayjs from 'dayjs';
import { Card } from 'antd';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import { get_data_delay_alerts, get_route, reverse_geocode } from '../utils/backendApiRequests';
import { pin, pinCarCrash, pinHazard } from '../utils/icons';

type Props = {
  mapMode: string;
  api: NotificationInstance;
  routeStreets: any;
  setRouteStreets: React.Dispatch<any>;
  showMarkers: boolean;
  alertsPoints: AdressPoint;
  mapRef: React.MutableRefObject<L.Map>;
  setMapMode: React.Dispatch<React.SetStateAction<'route' | 'street' | 'nothing'>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  drawAlertsAnyway: any;
  buttonStyleAlerts: 'primary' | 'default';
  useTrafficData: boolean;
};

// Function to create a numbered marker icon
const createNumberedMarker = (number: number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="position: relative;">
        <svg xmlns="http://www.w3.org/2000/svg" height="50" viewBox="0 -960 960 960" width="50">
          <path d="M480-80Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z" fill="#d4041c"/>
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -65%); color: white; font-size: 16px; font-weight: 600;">
          ${number}
        </div>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });
};

const Map = ({
  mapMode,
  api,
  drawAlertsAnyway,
  routeStreets,
  buttonStyleAlerts,
  setRouteStreets,
  showMarkers,
  alertsPoints,
  mapRef,
  setMapMode,
  loading,
  setLoading,
  useTrafficData,
}: Props) => {
  const { t } = useTranslation();
  const { setNewStreetsInSelected, setNewStreetsInMap, setNewStreetsInRoute, streetsInRoute } =
    useContext(streetContext);
  const { filter, setNewFilter } = useContext(filterContext);
  const { coordinates, setNewCoordinates, setNewRoute, route } = useContext(routeContext);
  const { setXAxisData, setJamsData, setAlertData } = useContext(dataContext);
  const [routeInfo, setRouteInfo] = useState<{ 
    length: number; 
    timeWithTraffic: number;
    timeWithoutTraffic: number;
  }>({ 
    length: 0, 
    timeWithTraffic: 0,
    timeWithoutTraffic: 0 
  });

  const MapClickEvent = () => {
    const handleContextMenu = (e) => {
      e.originalEvent.preventDefault();
    };

    useMapEvents({
      contextmenu: handleContextMenu,
      click: async (e) => {
        const map = mapRef.current;

        if (mapMode === 'route') {
          const marker = L.marker([e.latlng.lat, e.latlng.lng], { icon: createNumberedMarker(coordinates.length + 1) });
          marker.addTo(map);

          const coord: Coord = {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            marker: marker,
            street: '',
          };
          coordinates.push(coord);
          const lastIndex = coordinates ? coordinates.length - 1 : -1;
          const secondLastIndex = lastIndex - 1;

          const last_two = coordinates?.slice(-2);
          if (last_two.length > 1) {
            const key = coordinates.length.toString();
            const openNotification = () => {
              api['info']({
                key,
                message: t('route.selection.inProgress'),
                description: t('route.selection.loading'),
                placement: 'bottomRight',
                duration: 0,
                icon: <LoadingOutlined />,
              });
            };
            openNotification();
            setLoading(true);
            const response = await get_route(last_two[0], last_two[1], { ...filter, use_traffic: useTrafficData });

            if (response.streets_coord.length < 1) {
              const removedCoord: Coord = coordinates.pop();
              setNewCoordinates(coordinates);
              removedCoord.marker.remove();
              setTimeout(() => {
                api['error']({
                  key,
                  message: 'route not found',
                  description: 'Select different points - ideally with multiple pass points',
                  placement: 'bottomRight',
                });
              }, 1000);
              return;
            }
            setRouteStreets(response.streets_coord);
            const newStreetsInRoute2 = [
              ...new Set([...streetsInRoute, ...response.streets_coord.map((street) => street.street_name)]),
            ];

            setNewStreetsInRoute((prevState) => {
              return [...new Set([...prevState, ...response.streets_coord.map((street) => street.street_name)])];
            });
            setNewCoordinates((prevData) => {
              const newData = [...prevData];

              newData[lastIndex] = { ...newData[lastIndex], street: response.dst_street };
              newData[secondLastIndex] = { ...newData[secondLastIndex], street: response.src_street };
              if (newData[secondLastIndex].street == newData[lastIndex].street) {
                newData.pop();
              }
              return newData;
            });
            const new_route = [...route, ...response.route];
            setNewRoute((prevData) => {
              return [...prevData, ...response.route];
            });

            // Update route info
            setRouteInfo(prev => ({
              length: prev.length + (response.length || 0),
              timeWithTraffic: prev.timeWithTraffic + (response.time_with_traffic || 0),
              timeWithoutTraffic: prev.timeWithoutTraffic + (response.time_without_traffic || 0)
            }));

            const data = await get_data_delay_alerts(filter, new_route, newStreetsInRoute2);

            setJamsData(data.jams);
            setAlertData(data.alerts);
            setXAxisData(data.xaxis);
            setLoading(false);

            setTimeout(() => {
              api['success']({
                key,
                message: t('route.selection.inProgress'),
                description: t('route.selection.loading.done'),
                placement: 'bottomRight',
              });
            }, 1000);
          }
        } else if (mapMode == 'street') {
          // street
          const fetchReverseStreet = async () => {
            const key = 'loading street';
            const openNotification = () => {
              api['info']({
                key,
                message: t('data.loading.street'),
                description: t('data.loading.street.description'),
                placement: 'bottomRight',
                duration: 0,
                icon: <LoadingOutlined />,
              });
            };
            openNotification();
            const data = await reverse_geocode(filter, e);
            const newStreets = [];
            const streets = [];
            data?.streets?.forEach((element) => {
              const newDrawedStreet: StreetInMap = drawOnMap(map, element.street_name, element.path, element.color);
              newStreets.push(newDrawedStreet);
              streets.push(element.street_name);
            });
            setNewStreetsInMap((prevState) => [...prevState, ...newStreets]);
            setNewStreetsInSelected((prevState) => [...new Set([...prevState, ...streets])]);
            setNewFilter((prevState) => ({
              ...prevState,
              streets: [...new Set([...prevState.streets, ...streets])],
            }));
            setTimeout(() => {
              api['success']({
                key,
                message: t('data.loading.street'),
                description: t('data.loading.street.done'),
                placement: 'bottomRight',
              });
            }, 1000);
          };
          fetchReverseStreet();
        }
      },
    });
    return null;
  };

  return (
    <>
      <MapContainer
        ref={mapRef}
        center={[49.194391, 16.612064]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: 'calc(100dvh - 50px)', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickEvent />
        {showMarkers && (
          <MarkerClusterGroup chunkedLoading>
            {(alertsPoints as AdressPoint).map(
              (alert) =>
                alert?.visible && (
                  <Marker key={alert['key']} position={[alert['latitude'], alert['longitude']]} icon={alert['icon']}>
                    <Popup>
                      {t('type')}: {t(alert['type'])}
                      {alert['subtype'] && (
                        <p>
                          {t('subtype')}: {t(alert['subtype'])}
                        </p>
                      )}
                      {alert['street'] && (
                        <p>
                          {t('street')}: {alert['street']}
                        </p>
                      )}
                      <p>
                        {t('pubMillis')}: {dayjs(alert['pubMillis']).format('DD.MM.YYYY HH:mm')}
                      </p>
                    </Popup>
                  </Marker>
                ),
            )}
          </MarkerClusterGroup>
        )}
      </MapContainer>
      {mapMode === 'route' && coordinates.length > 0 && (
        <Card
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            padding: '1px 4px',
            borderRadius: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            lineHeight: '1.1'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '2px',
            paddingBottom: '1px',
            marginBottom: '1px',
            color: '#d4041c'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            <span>{t('sidebar.route')}</span>
          </div>
          <div>{t('route.length')}: {routeInfo.length < 1000 
            ? new Intl.NumberFormat('en-US', { style: 'unit', unit: 'meter', maximumFractionDigits: 1 }).format(routeInfo.length)
            : new Intl.NumberFormat('en-US', { style: 'unit', unit: 'kilometer', maximumFractionDigits: 1 }).format(routeInfo.length / 1000)}
          </div>
          <div>{t('route.duration')}: {routeInfo.timeWithTraffic < 60
            ? new Intl.NumberFormat('en-US', { style: 'unit', unit: 'second', maximumFractionDigits: 1 }).format(routeInfo.timeWithTraffic)
            : new Intl.NumberFormat('en-US', { style: 'unit', unit: 'minute', maximumFractionDigits: 1 }).format(routeInfo.timeWithTraffic / 60)}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {t('route.duration.withoutTraffic')}: {routeInfo.timeWithoutTraffic < 60
            ? new Intl.NumberFormat('en-US', { style: 'unit', unit: 'second', maximumFractionDigits: 1 }).format(routeInfo.timeWithoutTraffic)
            : new Intl.NumberFormat('en-US', { style: 'unit', unit: 'minute', maximumFractionDigits: 1 }).format(routeInfo.timeWithoutTraffic / 60)}
          </div>
        </Card>
      )}
    </>
  );
};
export default Map;
