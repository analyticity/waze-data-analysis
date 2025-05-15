import { backendApi } from './api';
import { routingApi } from './api';
import { Filter } from './contexts';
import { queryFindStreet, queryStreetCoord, queryTime } from './queryBuilder';

type ResponseDelayAlerts = {
  jams: [];
  alerts: [];
  xaxis: [];

  speedKMH: [];
  time: [];
  level: [];
  length: [];
};

type ResponseCriticalStreets = {
  streets_jams: [];
  values_jams: [];

  streets_alerts: [];
  values_alerts: [];
};

export type ResponseStreetsDrawing = {
  name: string;
  path: [[]];
  color: string;
};

function getRequestBody(filter: Filter) {
  const body = {
    from_date: filter?.fromDate,
    to_date: filter?.toDate,
    streets: filter?.streets,
    route: [],
  };
  return body;
}

function getRequestBodyWithRoute(filter: Filter, route, streetsInRoute: string[]) {
  const tmp = getRequestBody(filter);
  var body;
  if (route.length > 0) {
    const new_streets = [...new Set([...filter.streets, ...streetsInRoute])];
    body = { ...tmp, streets: new_streets, route: route };
  } else {
    body = { ...tmp, route: route };
  }
  return body;
}

export async function get_data_delay_alerts(filter: Filter, route, streetsInRoute: string[]) {
  if (!filter) {
    return null;
  }

  const body = getRequestBodyWithRoute(filter, route, streetsInRoute);
  const response = await backendApi.post('data_for_plot_drawer/', body);
  const data: ResponseDelayAlerts = {
    jams: response.data.jams,
    alerts: response.data.alerts,
    xaxis: response.data.xaxis,
    speedKMH: response.data.speedKMH,
    time: response.data.delay,
    level: response.data.level,
    length: response.data.length,
  };
  return data;
}

export async function get_data_critical_streets(filter: Filter, route, streetsInRoute: string[]) {
  if (!filter) {
    return;
  }
  const body = getRequestBodyWithRoute(filter, route, streetsInRoute);
  const response = await backendApi.post('data_for_plot_streets/', body);
  const data: ResponseCriticalStreets = {
    streets_jams: response.data.streets_jams,
    values_jams: response.data.values_jams,
    streets_alerts: response.data.streets_alerts,
    values_alerts: response.data.values_alerts,
  };
  return data;
}

export async function get_data_alert_types(filter: Filter, route, streetsInRoute: string[]) {
  if (!filter) {
    return;
  }
  const body = getRequestBodyWithRoute(filter, route, streetsInRoute);
  const response = await backendApi.post('data_for_plot_alerts/', body);
  return response.data;
}

export async function get_streets_coord(filter: Filter, newlySelected: string) {
  const response = await backendApi.get(`/street_coord/?${queryStreetCoord(filter, newlySelected)}`);
  return response.data;
}

export async function get_all_street_delays(filter: Filter, controller: AbortController) {
  const tmp = getRequestBody(filter);
  const body = { ...tmp, route: [] };
  const response = await backendApi.post(`/all_delays/`, body, { signal: controller.signal });
  const data = response.data;
  return data;
}

export async function get_all_street_alerts(
  filter: Filter,
  route: any[],
  streetsInRoute: string[],
  controller: AbortController,
) {
  const body = getRequestBodyWithRoute(filter, route, streetsInRoute);

  const response = await backendApi.post('draw_alerts/', body, { signal: controller.signal });
  return response.data;
}

export async function reverse_geocode(filter: Filter, e: L.LeafletMouseEvent) {
  const response = await backendApi.get(`reverse_geocode/street/?${queryFindStreet(e, filter)}`);
  return response.data;
}

export async function get_route(src_coord, dst_coord, filter: Filter) {
  const data_route = {
    src_coord: [src_coord.longitude, src_coord.latitude],
    dst_coord: [dst_coord.longitude, dst_coord.latitude],
    from_time: filter.fromDate,
    to_time: filter.toDate,
    use_traffic: filter.use_traffic || false
  };
  const response = await routingApi.post('find_route_by_coord/', data_route);

  return response.data;
}
