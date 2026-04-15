/**
 * Estructura tipada del campo JSONB `routeSegmentDetails` en routeSchedules.
 *
 * Models the COMPLETE daily truck route:
 *
 *   [origin/base] → segment 1 → segment 2 → … → segment N → [final/disposal site]
 */

// ── Waypoint ──────────────────────────────────────────────────────────────────

export interface Waypoint {
  /** Order within the segment (1, 2, 3…) */
  order: number;

  /** Decimal latitude. E.g.: -13.5300 */
  latitude: number;

  /** Decimal longitude. E.g.: -71.9610 */
  longitude: number;

  /** Optional label visible on the map. E.g.: "Esq. Jr. Las Flores" */
  label?: string;
}

// ── Origen (base operativa) ───────────────────────────────────────────────────

export interface RouteOrigin {
  latitude: number;
  longitude: number;

  /** E.g.: "Base Operativa Municipal - San Sebastián" */
  label?: string;

  /** Departure time from the base. E.g.: "05:30:00" */
  departureTime?: string;
}

// ── Segmento de recolección ───────────────────────────────────────────────────

export interface RouteSegment {
  /** Segment order (1, 2, 3…) */
  order: number;

  /** Descriptive name of the segment. E.g.: "Segment 1 - APV Carigrand" */
  areaName: string;

  /** Estimated pickup start time for this segment. E.g.: "05:45:00" */
  pickupTime?: string;

  /** Waiting time at the segment in minutes */
  waitingMinutes?: number;

  /** Estimated travel time for the segment in minutes (legacy field) */
  estimatedMinutes?: number;

  /** Additional notes about the segment */
  notes?: string;

  /** GPS waypoints for this segment in travel order */
  waypoints?: Waypoint[];
}

// ── Tramo final (botadero) ────────────────────────────────────────────────────

export interface RouteFinal {
  latitude: number;
  longitude: number;

  /** E.g.: "Botadero Jaquira" */
  label?: string;

  /** Travel time from last collection point to disposal site in minutes */
  travelMinutes?: number;

  /** Estimated arrival time at disposal site. E.g.: "12:50:00" */
  arrivalTime?: string;

  /** Waiting time at the disposal site in minutes */
  waitingMinutes?: number;

  /** Estimated return time to base. E.g.: "14:30:00" */
  returnToBaseTime?: string;

  /**
   * UUID of the disposal site (disposalSites table).
   * Optional — required only to use the generate-trip endpoint.
   */
  disposalSiteId?: string;

  /** Waypoints of the route to the disposal site (optional) */
  waypoints?: Waypoint[];

  /** Notes about the trip to the disposal site */
  notes?: string;
}

// ── Raíz del objeto ───────────────────────────────────────────────────────────

export interface RouteSegmentDetails {
  /** Starting point: operational base with departure time */
  origin?: RouteOrigin;

  /** Collection segments in order (order: 1, 2, 3…) */
  segments?: RouteSegment[];

  /** Final leg to the disposal site */
  final?: RouteFinal;

  /** @deprecated Use "final" instead. Kept for backward compatibility with old routes. */
  disposalTrip?: any;
}
