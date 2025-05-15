import axios, { AxiosInstance } from 'axios';

export const jamApi: AxiosInstance = axios.create({
  baseURL: `https://gis.brno.cz/ags1/rest/services/Hosted/WazeJams/FeatureServer`,
});

export const eventApi: AxiosInstance = axios.create({
  baseURL: `https://gis.brno.cz/ags1/rest/services/Hosted/WazeAlerts/FeatureServer`,
});

export const streetApi: AxiosInstance = axios.create({
  baseURL:
    'https://services6.arcgis.com/fUWVlHWZNxUvTUh8/arcgis/rest/services/ulicni_sit/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json',
});

let backendApi: AxiosInstance;
if (process.env.NODE_ENV !== 'production') {
  backendApi = axios.create({
    baseURL: 'http://127.0.0.1:8000/', // Dev env
  });
} else {
  backendApi = axios.create({
    baseURL: 'https://dexter.fit.vutbr.cz/dpmb/', // Prod env
  });
}

let routingApi: AxiosInstance;
if (process.env.NODE_ENV !== 'production') {
  routingApi = axios.create({
    baseURL: 'http://127.0.0.1:8001/', // Dev env
  });
} else {
  backendApi = axios.create({
    baseURL: '', // Prod env
  });
}

export { backendApi };
export { routingApi };