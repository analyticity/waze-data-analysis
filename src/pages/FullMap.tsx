import React, { useContext, useEffect, useRef, useState } from 'react';

import L, { Map as LeafletMap, map } from 'leaflet';
import { Button, Card, Col, Row, Select, SelectProps, message, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { filterContext, routeContext, streetContext } from '../utils/contexts';
import { StreetInMap } from '../types/StreetInMap';
import { deleteAllFromMap, drawOnMap } from '../utils/map';
import { RouteIcon } from '../utils/icons';
import DateSlider from '../Components/DateSlider';
import InfoModal from '../Components/ModalComponents/InfoModal';
import Sidebar from '../Components/SidebarComponents/Sidebar';
import 'leaflet/dist/leaflet.css';
import ApplicationTour from '../Components/SidebarComponents/ApplicationTour';
import { LoadingOutlined, HistoryOutlined } from '@ant-design/icons';
import * as Icons from '../utils/icons';
import { get_all_street_delays, get_all_street_alerts, get_streets_coord } from '../utils/backendApiRequests';

import Map from '../Components/Map';
import { AdressPoint } from '../types/baseTypes';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams';

type Coord = {
  latitude: number;
  longitude: number;
};

function getPinIcon(alert_type: string) {
  if (alert_type == 'JAM') {
    return Icons.pinJam;
  } else if (alert_type == 'HAZARD') {
    return Icons.pinHazard;
  } else if (alert_type == 'ACCIDENT') {
    return Icons.pinCarCrash;
  } else if (alert_type == 'ROAD_CLOSED') {
    return Icons.pinRoadClosed;
  }
  return Icons.pin;
}

const FullMap = () => {
  const { filter, setNewFilter } = useContext(filterContext);
  const {
    streetsInRoute,
    setNewStreetsInSelected,
    streetsInSelected,
    streetsInMap,
    setNewStreetsInMap,
    newlySelected,
  } = useContext(streetContext);
  const { route, coordinates } = useContext(routeContext);

  const mapRef = useRef<LeafletMap>(null);
  const { t } = useTranslation();

  const refStats = useRef(null);
  const refLineStats = useRef(null);
  const refContacForm = useRef(null);
  const refRoute = useRef(null);
  const refDelays = useRef(null);
  const refAlerts = useRef(null);
  const refRouteSidebar = useRef(null);
  const refTrafficData = useRef(null);

  const [openInfoModalState, setOpenInfoModalState] = useState<boolean>(false);
  const [openTour, setOpenTour] = useState<boolean>(false);
  const [buttonStyle, setButtonStyle] = useState<'default' | 'primary'>('default');
  const [buttonStyleDelay, setButtonStyleDelay] = useState<'default' | 'primary'>('default');
  const [buttonStyleDelayDisabled, setButtonStyleDelayDisabled] = useState<boolean>(false);
  const [buttonStyleAlerts, setButtonStyleAlerts] = useState<'default' | 'primary'>('default');
  const [buttonStyleAlertsDisabled, setButtonStyleAlertsDisabled] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'route' | 'street' | 'nothing'>('street');
  const [useTrafficData, setUseTrafficData] = useState<boolean>(false);
  const [api, contextHolder] = notification.useNotification({ stack: { threshold: 3 } });
  const [delayStreets, setDelayStreets] = useState<StreetInMap[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMarkers, setShowMarkers] = useState<boolean>(false);
  const [alertsPoints, setAlertsPoints] = useState<AdressPoint>([]);

  const [routeStreets, setRouteStreets] = useState<any>([]);
  const controller = useRef<AbortController>(new AbortController());
  const controllerAlerts = useRef<AbortController>(new AbortController());

  const findRoute = () => {
    if (buttonStyle === 'default') {
      deleteAllFromMap(delayStreets); //odmazem vsetky vykreslene ulice
      setButtonStyle('primary');
      setButtonStyleDelay('default');
      setMapMode('route');
      setButtonStyleDelayDisabled(true);
      setButtonStyleAlertsDisabled(true);
    } else {
      setButtonStyle('default');
      setMapMode('street');
      setButtonStyleDelayDisabled(false);
      setButtonStyleAlertsDisabled(false);
    }
  };
  useUrlSearchParams();

  const allDelayData = async () => {
    const map = mapRef.current;
    deleteAllFromMap(delayStreets);

    setNewStreetsInSelected([]);

    const key = 'data_delay';
    const openNotification = () => {
      api['info']({
        key,
        message: t('loading.data'),
        description: t('data.delay.loading'),
        placement: 'bottomRight',
        duration: 0,
        icon: <LoadingOutlined />,
      });
    };
    openNotification();
    var data;
    try {
      data = await get_all_street_delays({ ...filter, use_traffic: useTrafficData }, controller.current);
    } catch (error) {
      data = [];
      setNewFilter((prevData) => {
        return { ...prevData, streets: [] };
      });
      setTimeout(() => {
        api['error']({
          key,
          message: t('loading.data'),
          description: t('data.delay.loading.stopped'),
          placement: 'bottomRight',
        });
      }, 1000);
      return;
    }
    const streets: StreetInMap[] = [];
    setNewFilter((prevData) => {
      return { ...prevData, streets: [] };
    });
    data?.forEach((element) => {
      streets.push(drawOnMap(map, element?.street, element?.path, element?.color));
    });
    setDelayStreets(streets);
    setTimeout(() => {
      api['success']({
        key,
        message: t('loading.data'),
        description: t('data.delay.loading'),
        placement: 'bottomRight',
      });
    }, 1000);
    setMapMode('nothing');
  };

  const drawDelays = async () => {
    if (buttonStyleDelay === 'default') {
      setButtonStyleDelay('primary');
      setButtonStyle('default');
      allDelayData();
    } else {
      setButtonStyleDelay('default');
      deleteAllFromMap(delayStreets);
      if (route.length === 0) {
        deleteAllFromMap(streetsInMap);
      }
      setNewStreetsInSelected([]);
      setNewStreetsInMap([]);
      setDelayStreets([]);
      controller.current.abort();
      return;
    }
  };

  const allAlertData = async () => {
    const key = 'alertData';

    const openNotification = () => {
      api['info']({
        key,
        message: t('loading.data'),
        description: t('data.alerts.loading'),
        placement: 'bottomRight',
        duration: 0,
        icon: <LoadingOutlined />,
      });
    };
    openNotification();
    var data: AdressPoint;
    try {
      data = await get_all_street_alerts(filter, route, streetsInRoute, controllerAlerts.current);
    } catch (error) {
      data = [];
      setTimeout(() => {
        api['error']({
          key,
          message: t('loading.data'),
          description: t('data.alerts.loading.stopped'),
          placement: 'bottomRight',
        });
      }, 1000);
      return;
    }
    const newData: AdressPoint = data.map((obj) => ({ ...obj, visible: true, icon: getPinIcon(obj.type) }));

    setAlertsPoints(newData);
    setShowMarkers(true);
    setTimeout(() => {
      api['success']({
        key,
        message: t('loading.data'),
        description: t('data.alerts.loading'),
        placement: 'bottomRight',
      });
    }, 1000);
  };
  const drawAlerts = async () => {
    if (buttonStyleAlerts === 'default') {
      setButtonStyleAlerts('primary');
      allAlertData();
    } else {
      setButtonStyleAlerts('default');
      setShowMarkers(false);
      controllerAlerts.current.abort();

      return;
    }
  };

  const drawAlertsAnyway = async () => {
    allAlertData();
  };

  useEffect(() => {
    if (mapRef.current) {
      if (route.length > 0) {
        coordinates?.forEach((obj) => {
          obj.marker.addTo(mapRef.current);
        });
      }
      streetsInMap?.forEach((obj) => obj.lines?.forEach((line) => line?.addTo(mapRef?.current)));
    }
  }, [mapRef.current]);

  useEffect(() => {
    if (!newlySelected) {
      return;
    }

    const map = mapRef.current;
    const fetchData = async () => {
      const isMatched = streetsInMap.some((street) => street.name === newlySelected);

      if (!isMatched) {
        const data = await get_streets_coord(filter, newlySelected);
        const newStreets = [];
        data?.streets?.forEach((element) => {
          const newDrawedStreet: StreetInMap = drawOnMap(map, element.street_name, element.path, element.color);
          newStreets.push(newDrawedStreet);
        });
        setNewStreetsInMap((prevState) => [...prevState, ...newStreets]);

        return data;
      }
    };

    fetchData();
  }, [newlySelected]);

  useEffect(() => {
    if (routeStreets.length < 1) {
      setButtonStyleDelayDisabled(false);
      return;
    }
    const map = mapRef.current;
    var newStreetsInMap: StreetInMap[] = [];
    console.log(routeStreets);
    setButtonStyleDelayDisabled(true);

    routeStreets?.forEach((element) => {
      const streetInMapNew: StreetInMap = drawOnMap(map, element?.street_name, element?.path, element?.color);
      newStreetsInMap.push(streetInMapNew);
    });

    setNewStreetsInMap((prevState: StreetInMap[]) => {
      if (prevState.length < 1) {
        return newStreetsInMap;
      }
      const stateCopy = [...prevState];
      const newStreets: StreetInMap[] = [];

      newStreetsInMap.forEach((streetInMap) => {
        const index = prevState.findIndex(({ name }) => name === streetInMap.name);
        if (index > -1) {
          stateCopy[index] = { ...stateCopy[index], lines: [...stateCopy[index].lines, ...streetInMap.lines] };
        } else {
          newStreets.push(streetInMap);
        }
      });
      return [...stateCopy, ...newStreets];
    });

    if (buttonStyleAlerts == 'primary') {
      console.log('robim daco');
      allAlertData();
    }
  }, [routeStreets]);

  useEffect(() => {
    if (buttonStyleAlerts == 'primary') {
      allAlertData();
      const streetToRemove = streetsInSelected?.filter((item) => !filter?.streets.includes(item));
      const newAlertPoints = alertsPoints?.filter((item) => !streetToRemove.includes(item.street));
      setAlertsPoints(newAlertPoints);
    }
  }, [filter]);

  return (
    <div>
      <Row style={{ flexFlow: 'unset' }}>
        {contextHolder}
        <InfoModal
          openInfoModalState={openInfoModalState}
          setOpenInfoModalState={setOpenInfoModalState}
          setOpenTour={setOpenTour}
        />
        <Col className="sidermenu">
          <Sidebar
            setOpenInfoModalState={setOpenInfoModalState}
            refStats={refStats}
            map={mapRef.current}
            refLineStats={refLineStats}
            refContacForm={refContacForm}
            refRoute={refRouteSidebar}
            setRouteStreets={setRouteStreets}
            showMarkers={showMarkers}
            alertsPoints={alertsPoints}
            setAlertsPoints={setAlertsPoints}
            loading={loading}
            setLoading={setLoading}
          />
        </Col>
        <Col span={23} style={{ position: 'relative', flex: '1', maxWidth: 'unset' }}>
          <div className="divButtonsOnMap">
            <Button className="buttonRoute" ref={refRoute} type={buttonStyle} onClick={findRoute}>
              {buttonStyle == 'default' && t('route.button')}
              {buttonStyle == 'primary' && t('route.button.active')}
              <RouteIcon />
            </Button>
            <Button 
              className="buttonRoute" 
              type={useTrafficData ? 'primary' : 'default'}
              onClick={() => setUseTrafficData(!useTrafficData)}
              ref={refTrafficData}
            >
              <HistoryOutlined style={{ fontSize: 20 }} />
              {t('traffic.useTrafficData')}
            </Button>
            <Button
              ref={refDelays}
              className="buttonRoute"
              type={buttonStyleDelay}
              disabled={buttonStyleDelayDisabled}
              onClick={drawDelays}
            >
              {t('Jams')}
              <Icons.CarSmallIcon />
            </Button>
            <Button
              ref={refAlerts}
              className="buttonRoute"
              type={buttonStyleAlerts}
              disabled={buttonStyleAlertsDisabled}
              onClick={drawAlerts}
            >
              {t('Alerts')}
              <Icons.WarningSmallIcon />
            </Button>
          </div>

          <Map
            mapMode={mapMode}
            mapRef={mapRef}
            api={api}
            routeStreets={routeStreets}
            setRouteStreets={setRouteStreets}
            showMarkers={showMarkers}
            alertsPoints={alertsPoints}
            setMapMode={setMapMode}
            loading={loading}
            setLoading={setLoading}
            drawAlertsAnyway={drawAlertsAnyway}
            buttonStyleAlerts={buttonStyleAlerts}
            useTrafficData={useTrafficData}
          />

          <div className="divTimelineOnMap">
            <DateSlider />
          </div>
        </Col>

        <ApplicationTour
          refStats={refStats}
          refLineStats={refLineStats}
          refContacForm={refContacForm}
          refRoute={refRoute}
          refRouteSidebar={refRouteSidebar}
          refDelays={refDelays}
          refAlerts={refAlerts}
          openTour={openTour}
          setOpenTour={setOpenTour}
        ></ApplicationTour>
      </Row>
    </div>
  );
};

export default FullMap;
