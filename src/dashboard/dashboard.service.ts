import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getAdminDashboard(municipalityId: string) {
    const now          = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr     = startOfToday.toISOString().slice(0, 10);

    // ── Todo en paralelo ─────────────────────────────────────────────────────
    const [
      neighborsData,
      trucksData,
      fleetData,
      collectionsData,
      pointsData,
      complaintsData,
      vouchersData,
      recentCollections,
      recentComplaints,
    ] = await Promise.all([

      // 1. VECINOS
      this.dataSource.query(`
        SELECT
          COUNT(*)                                              AS total,
          COUNT(*) FILTER (WHERE "isActive" = true)            AS active,
          COUNT(*) FILTER (WHERE "createdAt" >= $2)            AS new_today,
          COUNT(*) FILTER (WHERE "createdAt" >= $3)            AS new_month
        FROM users
        WHERE "municipalityId" = $1
          AND "userType" = 'NEIGHBOR'
          AND "isArchived" = false
      `, [municipalityId, startOfToday, startOfMonth]),

      // 2. FLOTA — camiones
      this.dataSource.query(`
        SELECT
          COUNT(*)                                                     AS total,
          COUNT(*) FILTER (WHERE "isActive" = true AND "isArchived" = false)  AS active,
          COUNT(*) FILTER (WHERE "isActive" = false AND "isArchived" = false) AS inactive,
          COUNT(*) FILTER (WHERE "isArchived" = true)                         AS archived
        FROM trucks
        WHERE "municipalityId" = $1
      `, [municipalityId]),

      // 3. FLOTA — estado GPS hoy (MOVING/STOPPED/OFFLINE/NO_GPS)
      this.dataSource.query(`
        WITH last_pos AS (
          SELECT DISTINCT ON (tp."truckId")
            tp."truckId",
            tp.speed,
            tp.timestamp,
            EXTRACT(EPOCH FROM (NOW() - tp.timestamp)) / 60 AS minutes_ago
          FROM "truckPositions" tp
          INNER JOIN trucks t ON t.id = tp."truckId"
          WHERE t."municipalityId" = $1
            AND t."isArchived" = false
            AND tp.timestamp >= $2
          ORDER BY tp."truckId", tp.timestamp DESC
        )
        SELECT
          COUNT(*) FILTER (WHERE minutes_ago <= 5 AND speed >= 3)  AS moving,
          COUNT(*) FILTER (WHERE minutes_ago <= 5 AND speed < 3)   AS stopped,
          COUNT(*) FILTER (WHERE minutes_ago > 5)                  AS offline
        FROM last_pos
      `, [municipalityId, startOfToday]),

      // 4. RECOLECCIONES
      this.dataSource.query(`
        SELECT
          COUNT(*)                                   AS total,
          COUNT(*) FILTER (WHERE "createdAt" >= $2)  AS today,
          COUNT(*) FILTER (WHERE "createdAt" >= $3)  AS this_month,
          COALESCE(SUM("pointsAwarded"), 0)           AS total_points_awarded,
          COALESCE(SUM("pointsAwarded") FILTER (WHERE "createdAt" >= $2), 0) AS points_today,
          COALESCE(SUM("pointsAwarded") FILTER (WHERE "createdAt" >= $3), 0) AS points_month
        FROM collections
        WHERE "municipalityId" = $1
      `, [municipalityId, startOfToday, startOfMonth]),

      // 5. PUNTOS — total en circulación
      this.dataSource.query(`
        SELECT
          COALESCE(SUM(up."balancePoints"), 0)   AS total_balance,
          COALESCE(AVG(up."balancePoints"), 0)   AS avg_balance,
          COUNT(up."userId")                     AS neighbors_with_points,
          MAX(up."balancePoints")                AS max_balance
        FROM "userPoints" up
        INNER JOIN users u ON u.id = up."userId"
        WHERE u."municipalityId" = $1
          AND u."isArchived" = false
      `, [municipalityId]),

      // 6. RECLAMOS
      this.dataSource.query(`
        SELECT
          COUNT(*)                                                         AS total,
          COUNT(*) FILTER (WHERE status = 'OPEN')                         AS open,
          COUNT(*) FILTER (WHERE status = 'IN_REVIEW')                    AS in_review,
          COUNT(*) FILTER (WHERE status = 'RESOLVED')                     AS resolved,
          COUNT(*) FILTER (WHERE status = 'REJECTED')                     AS rejected,
          COUNT(*) FILTER (WHERE "createdAt" >= $2)                       AS today,
          COUNT(*) FILTER (WHERE "createdAt" >= $3)                       AS this_month
        FROM complaints
        WHERE "municipalityId" = $1
      `, [municipalityId, startOfToday, startOfMonth]),

      // 7. VOUCHERS / CANJES
      this.dataSource.query(`
        SELECT
          COUNT(*)                                                          AS total,
          COUNT(*) FILTER (WHERE status = 'GENERATED')                     AS pending,
          COUNT(*) FILTER (WHERE status = 'REDEEMED')                      AS redeemed,
          COUNT(*) FILTER (WHERE status = 'EXPIRED')                       AS expired,
          COUNT(*) FILTER (WHERE "issuedAt" >= $2)                         AS today,
          COUNT(*) FILTER (WHERE "issuedAt" >= $3)                         AS this_month,
          COALESCE(SUM("pointsUsed"), 0)                                   AS total_points_used,
          COALESCE(SUM("pointsUsed") FILTER (WHERE "issuedAt" >= $3), 0)  AS points_used_month
        FROM vouchers
        WHERE "municipalityId" = $1
      `, [municipalityId, startOfToday, startOfMonth]),

      // 8. ÚLTIMAS 5 RECOLECCIONES
      this.dataSource.query(`
        SELECT
          c.id,
          c."createdAt",
          c."pointsAwarded",
          c."verificationMethod",
          u.name AS "userName",
          u."lastName" AS "userLastName",
          t."licensePlate"
        FROM collections c
        LEFT JOIN users  u ON u.id = c."userId"
        LEFT JOIN trucks t ON t.id = c."truckId"
        WHERE c."municipalityId" = $1
        ORDER BY c."createdAt" DESC
        LIMIT 5
      `, [municipalityId]),

      // 9. ÚLTIMOS 5 RECLAMOS
      this.dataSource.query(`
        SELECT
          c.id,
          c."createdAt",
          c.status,
          c.description,
          u.name AS "userName",
          u."lastName" AS "userLastName",
          cat.name AS "categoryName",
          cat.priority
        FROM complaints c
        LEFT JOIN users u ON u.id = c."userId"
        LEFT JOIN "complaintCategories" cat ON cat.id = c."categoryId"
        WHERE c."municipalityId" = $1
        ORDER BY c."createdAt" DESC
        LIMIT 5
      `, [municipalityId]),
    ]);

    const n   = neighborsData[0];
    const t   = trucksData[0];
    const f   = fleetData[0];
    const col = collectionsData[0];
    const pts = pointsData[0];
    const cmp = complaintsData[0];
    const vch = vouchersData[0];

    // Camiones sin GPS hoy
    const totalActive  = parseInt(t.active);
    const withGps      = parseInt(f.moving) + parseInt(f.stopped) + parseInt(f.offline);
    const noGpsToday   = Math.max(0, totalActive - withGps);

    return {
      generatedAt:      now.toISOString(),
      generatedAtLocal: now.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      municipalityId,

      // ── MÓDULO: VECINOS ───────────────────────────────────────────────────
      neighbors: {
        total:       parseInt(n.total),
        active:      parseInt(n.active),
        newToday:    parseInt(n.new_today),
        newThisMonth:parseInt(n.new_month),
      },

      // ── MÓDULO: FLOTA ─────────────────────────────────────────────────────
      fleet: {
        total:    parseInt(t.total),
        active:   parseInt(t.active),
        inactive: parseInt(t.inactive),
        archived: parseInt(t.archived),
        gpsToday: {
          moving:  parseInt(f.moving),
          stopped: parseInt(f.stopped),
          offline: parseInt(f.offline),
          noGps:   noGpsToday,
        },
      },

      // ── MÓDULO: RECOLECCIONES ─────────────────────────────────────────────
      collections: {
        total:             parseInt(col.total),
        today:             parseInt(col.today),
        thisMonth:         parseInt(col.this_month),
        totalPointsAwarded:parseInt(col.total_points_awarded),
        pointsToday:       parseInt(col.points_today),
        pointsThisMonth:   parseInt(col.points_month),
      },

      // ── MÓDULO: PUNTOS ────────────────────────────────────────────────────
      points: {
        totalInCirculation: parseInt(pts.total_balance),
        avgPerNeighbor:     Math.round(parseFloat(pts.avg_balance)),
        neighborsWithPoints:parseInt(pts.neighbors_with_points),
        topBalance:         parseInt(pts.max_balance),
      },

      // ── MÓDULO: RECLAMOS ──────────────────────────────────────────────────
      complaints: {
        total:     parseInt(cmp.total),
        open:      parseInt(cmp.open),
        inReview:  parseInt(cmp.in_review),
        resolved:  parseInt(cmp.resolved),
        rejected:  parseInt(cmp.rejected),
        today:     parseInt(cmp.today),
        thisMonth: parseInt(cmp.this_month),
      },

      // ── MÓDULO: VOUCHERS / CANJES ─────────────────────────────────────────
      vouchers: {
        total:           parseInt(vch.total),
        pending:         parseInt(vch.pending),
        redeemed:        parseInt(vch.redeemed),
        expired:         parseInt(vch.expired),
        today:           parseInt(vch.today),
        thisMonth:       parseInt(vch.this_month),
        totalPointsUsed: parseInt(vch.total_points_used),
        pointsUsedMonth: parseInt(vch.points_used_month),
      },

      // ── ACTIVIDAD RECIENTE ────────────────────────────────────────────────
      recentActivity: {
        collections: recentCollections.map((r: any) => ({
          id:                r.id,
          createdAt:         r.createdAt,
          pointsAwarded:     parseInt(r.pointsAwarded),
          verificationMethod:r.verificationMethod,
          neighborName:      `${r.userName ?? ''} ${r.userLastName ?? ''}`.trim() || null,
          licensePlate:      r.licensePlate,
        })),
        complaints: recentComplaints.map((r: any) => ({
          id:           r.id,
          createdAt:    r.createdAt,
          status:       r.status,
          description:  r.description?.slice(0, 80) + (r.description?.length > 80 ? '...' : ''),
          neighborName: `${r.userName ?? ''} ${r.userLastName ?? ''}`.trim() || null,
          category:     r.categoryName,
          priority:     r.priority,
        })),
      },
    };
  }
}
