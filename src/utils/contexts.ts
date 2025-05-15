import React from 'react';
import dayjs from 'dayjs';
import { StreetInMap } from '../types/StreetInMap';
import { Coord } from '../types/baseTypes';

export interface Filter {
  fromDate: string;
  toDate: string;
  streets: Array<string>;
  use_traffic: boolean;
}

export interface FilterContext {
  filter: Filter | null;
  filterDefaultValue: Filter;
  setNewFilter: React.Dispatch<React.SetStateAction<Filter>>;
}

export const FILTER_DEFAULT_VALUE: FilterContext = {
  filterDefaultValue: {
    fromDate: dayjs().add(-7, 'd').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    streets: [],
    use_traffic: false
  },
  filter: null,
  setNewFilter: () => {},
};

export const filterContext = React.createContext<FilterContext>(FILTER_DEFAULT_VALUE);

export interface RouteContext {
  route: any[];
  coordinates: Coord[];

  setNewRoute: React.Dispatch<React.SetStateAction<any[]>>;
  setNewCoordinates: React.Dispatch<React.SetStateAction<Coord[]>>;
}
export const ROUTE_CONTEXT_DEFAULT_VALUE: RouteContext = {
  route: [],
  coordinates: [],

  setNewRoute: () => {},
  setNewCoordinates: () => {},
};

export const routeContext = React.createContext<RouteContext>(ROUTE_CONTEXT_DEFAULT_VALUE);

export interface StreetContext {
  streetsInMap: StreetInMap[];
  streetsInSelected: string[];
  setNewStreetsInMap: React.Dispatch<React.SetStateAction<StreetInMap[]>>;
  setNewStreetsInSelected: React.Dispatch<React.SetStateAction<string[]>>;

  newlySelected: string;
  setNewNewlySelected: (selected: string) => void;
  streetsInRoute: string[];
  setNewStreetsInRoute: React.Dispatch<React.SetStateAction<string[]>>;
}

export const STREET_CONTEXT_DEFAULT_VALUE: StreetContext = {
  streetsInMap: [],
  streetsInSelected: [],
  newlySelected: '',
  streetsInRoute: [],
  setNewStreetsInMap: () => {},
  setNewStreetsInSelected: () => {},
  setNewNewlySelected: () => {},
  setNewStreetsInRoute: () => {},
};

export const streetContext = React.createContext<StreetContext>(STREET_CONTEXT_DEFAULT_VALUE);

export interface DataContext {
  dateTimeFrom: string;
  dateTimeTo: string;
  previousDate: string;
  xAxisData: [];
  jamsData: [];
  alertData: [];
  levelData: [];
  speedData: [];
  lengthData: [];
  timeData: [];
  alertTypes: {};
  fullAlerts: [];
  fullJams: [];
  fullXAxis: [];

  setDateTimeFrom: (dateTime: string) => void;
  setDateTimeTo: (dateTime: string) => void;
  setPreviousDate: (date: string) => void;
  setXAxisData: (xAxisData: []) => void;
  setJamsData: (data: []) => void;
  setAlertData: (data: []) => void;
  setLevelData: (data: []) => void;
  setSpeedData: (data: []) => void;
  setLengthData: (data: []) => void;
  setTimeData: (data: []) => void;
  setAlertTypes: (data: {}) => void;
  setFullAlerts: (data: {}) => void;
  setFullJams: (data: {}) => void;
  setFullXAxis: (data: {}) => void;
}

export const DATA_CONTEXT_DEFAULT_VALUE: DataContext = {
  dateTimeFrom: '',
  dateTimeTo: '',
  previousDate: '',
  xAxisData: [],
  jamsData: [],
  alertData: [],
  levelData: [],
  speedData: [],
  lengthData: [],
  timeData: [],
  alertTypes: {},
  fullAlerts: [],
  fullJams: [],
  fullXAxis: [],

  setDateTimeFrom: () => {},
  setDateTimeTo: () => {},
  setPreviousDate: () => {},
  setXAxisData: () => {},
  setJamsData: () => {},
  setAlertData: () => {},
  setLevelData: () => {},
  setSpeedData: () => {},
  setLengthData: () => {},
  setTimeData: () => {},
  setAlertTypes: () => {},
  setFullAlerts: () => {},
  setFullJams: () => {},
  setFullXAxis: () => {},
};

export const dataContext = React.createContext<DataContext>(DATA_CONTEXT_DEFAULT_VALUE);
