"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { money, OpsShell } from "../components/OpsShell";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const api = createApiClient({
  baseUrl: API,
  credentials: "include",
});

type Mobility = {
  generatedAt: string;
  kpis: {
    activeRides: number;
    onlineDrivers: number;
    pendingDrivers: number;
    activeDeliveries: number;
    unassignedDeliveries: number;
  };
  rides: Array<{
    id: string;
    status: string;
    driverUserId: string | null;
    fareFundingStatus: string;
    rideClass: string;
    distanceMeters: number;
    durationSeconds: number;
    totalMinor: number;
    currency: string;
    createdAt: string;
  }>;
  drivers: Array<{
    userId: string;
    approvalStatus: string;
    availability: string;
    serviceClasses: string[];
    ratingAverage: number | null;
    ratingCount: number;
    lastLocationAt: string | null;
    platformDebtMinor: number;
  }>;
  deliveries: Array<{
    id: string;
    publicCode: string;
    trackingCode: string;
    status: string;
    assignedCourierUserId: string | null;
    scheduledFor: string | null;
    serviceLevel: string;
    distanceMeters: number | null;
    etaMinutes: number;
    amountMinor: number;
    currency: string;
    createdAt: string;
    completedAt: string | null;
  }>;
};

export default function MobilityOperations() {
  const [data, setData] = useState<Mobility | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.get<Mobility>("/v1/operations/mobility"));
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load Mobility Operations",
      );
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <OpsShell active="/mobility">
      <main className="ops-v31-main">
        <section className="ops-v32-domain-hero mobility">
          <div>
            <span className="ops-v31-kicker">MOBILITY OPERATIONS</span>
            <h1>Drive and delivery, one network.</h1>
            <p>
              Observe rides, drivers, courier assignment and logistics
              bookings. Detailed driver compliance and fuel controls stay
              inside Drive Operations.
            </p>
          </div>

          <div className="ops-v32-domain-live">
            <span>NETWORK LOAD</span>
            <strong>
              {data
                ? data.kpis.activeRides + data.kpis.activeDeliveries
                : "—"}
            </strong>
            <small>active rides + deliveries</small>
          </div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}

        <section className="ops-v31-command-kpis">
          <article>
            <span>ACTIVE RIDES</span>
            <strong>{data?.kpis.activeRides ?? "—"}</strong>
            <small>Drive workload</small>
          </article>
          <article>
            <span>ONLINE DRIVERS</span>
            <strong>{data?.kpis.onlineDrivers ?? "—"}</strong>
            <small>available driver fleet</small>
          </article>
          <article
            className={data?.kpis.pendingDrivers ? "attention" : ""}
          >
            <span>DRIVER REVIEWS</span>
            <strong>{data?.kpis.pendingDrivers ?? "—"}</strong>
            <small>pending compliance approval</small>
          </article>
          <article>
            <span>ACTIVE DELIVERIES</span>
            <strong>{data?.kpis.activeDeliveries ?? "—"}</strong>
            <small>logistics bookings in progress</small>
          </article>
          <article
            className={data?.kpis.unassignedDeliveries ? "attention" : ""}
          >
            <span>UNASSIGNED</span>
            <strong>{data?.kpis.unassignedDeliveries ?? "—"}</strong>
            <small>delivery bookings needing courier assignment</small>
          </article>
        </section>

        <div className="ops-v31-dashboard-grid">
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">DRIVE</span>
                <h2>Recent ride network</h2>
              </div>
              <a href="/drive">Open Drive controls →</a>
            </div>

            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead>
                  <tr>
                    <th>Ride</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Driver</th>
                    <th>Distance</th>
                    <th>Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rides ?? []).slice(0, 50).map((ride) => (
                    <tr key={ride.id}>
                      <td>
                        <strong>{ride.id.slice(0, 10)}</strong>
                        <small>
                          {new Date(ride.createdAt).toLocaleTimeString(
                            "en-NG",
                          )}
                        </small>
                      </td>
                      <td>{ride.rideClass}</td>
                      <td>
                        <span className="ops-v31-soft-chip">
                          {ride.status}
                        </span>
                      </td>
                      <td>
                        {ride.driverUserId
                          ? ride.driverUserId.slice(0, 10)
                          : "Searching"}
                      </td>
                      <td>
                        {(ride.distanceMeters / 1000).toFixed(1)} km
                      </td>
                      <td>
                        <strong>
                          {money(ride.totalMinor, ride.currency)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">DRIVER FLEET</span>
                <h2>Availability snapshot</h2>
              </div>
            </div>

            <div className="ops-v32-driver-list">
              {(data?.drivers ?? []).slice(0, 20).map((driver) => (
                <article key={driver.userId}>
                  <span
                    className={
                      driver.availability === "ONLINE"
                        ? "ops-v32-presence online"
                        : "ops-v32-presence"
                    }
                  />
                  <div>
                    <strong>{driver.userId.slice(0, 12)}</strong>
                    <small>
                      {driver.approvalStatus} ·{" "}
                      {driver.serviceClasses.join(", ")}
                    </small>
                  </div>
                  <b>{driver.availability}</b>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section className="ops-v31-panel ops-v32-store-section">
          <div className="ops-v31-section-head">
            <div>
              <span className="ops-v31-kicker">DELIVERY / LOGISTICS</span>
              <h2>Booking network</h2>
            </div>
          </div>

          <div className="ops-v32-table-wrap">
            <table className="ops-v32-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Courier</th>
                  <th>Distance</th>
                  <th>ETA</th>
                  <th>Charge</th>
                </tr>
              </thead>
              <tbody>
                {(data?.deliveries ?? []).slice(0, 60).map((delivery) => (
                  <tr key={delivery.id}>
                    <td>
                      <strong>{delivery.publicCode}</strong>
                      <small>{delivery.trackingCode}</small>
                    </td>
                    <td>{delivery.serviceLevel}</td>
                    <td>
                      <span className="ops-v31-soft-chip">
                        {delivery.status}
                      </span>
                    </td>
                    <td>
                      {delivery.assignedCourierUserId
                        ? delivery.assignedCourierUserId.slice(0, 10)
                        : "Unassigned"}
                    </td>
                    <td>
                      {delivery.distanceMeters == null
                        ? "—"
                        : `${(delivery.distanceMeters / 1000).toFixed(
                            1,
                          )} km`}
                    </td>
                    <td>{delivery.etaMinutes} min</td>
                    <td>
                      <strong>
                        {money(
                          delivery.amountMinor,
                          delivery.currency,
                        )}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </OpsShell>
  );
}
