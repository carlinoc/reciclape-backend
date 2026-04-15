export enum RouteShift {
  MORNING   = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT     = 'NIGHT',
}

export enum RouteTurnNumber {
  FIRST  = 'FIRST',
  SECOND = 'SECOND',
}

export const ROUTE_SHIFT_LABELS: Record<RouteShift, string> = {
  [RouteShift.MORNING]:   'Mañana',
  [RouteShift.AFTERNOON]: 'Tarde',
  [RouteShift.NIGHT]:     'Noche',
};

export const ROUTE_TURN_LABELS: Record<RouteTurnNumber, string> = {
  [RouteTurnNumber.FIRST]:  'Primer Turno',
  [RouteTurnNumber.SECOND]: 'Segundo Turno',
};
