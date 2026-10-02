"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { OpsShell } from "../components/OpsShell";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const api = createApiClient({ baseUrl: API, credentials: "include" });

type Role = { id: string; key: string; name: string; description: string | null; permissions: string[] };
type AssignedRole = { assignmentId: string; roleKey: string; roleName: string };
type Employee = { userId: string; displayName: string | null; email: string | null; status: string; roles: AssignedRole[] };
type DirectoryUser = Employee & { verificationLevel?: string; createdAt?: string };

function identity(user: Pick<Employee, "displayName" | "email" | "userId">) {
  return user.displayName || user.email || user.userId;
}

export default function OperationsAccessPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const loadAccess = useCallback(async () => {
    try {
      const result = await api.get<{ roles: Role[]; employees: Employee[] }>("/v1/operations/access");
      setRoles(result.roles);
      setEmployees(result.employees);
      setSelectedRole((current) => current || result.roles.find((role) => role.key !== "platform.operations.admin")?.key || result.roles[0]?.key || "");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Operations access.");
    }
  }, []);

  const searchDirectory = useCallback(async (term = "") => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (term.trim()) params.set("q", term.trim());
      const result = await api.get<{ users: DirectoryUser[] }>(`/v1/operations/management/users?${params.toString()}`);
      setDirectory(result.users);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not search the BazID user directory.");
    }
  }, []);

  useEffect(() => { void loadAccess(); void searchDirectory(); }, [loadAccess, searchDirectory]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void searchDirectory(search); }, 250);
    return () => window.clearTimeout(timer);
  }, [search, searchDirectory]);

  const allUsers = useMemo(() => {
    const map = new Map<string, DirectoryUser>();
    directory.forEach((user) => map.set(user.userId, user));
    employees.forEach((employee) => map.set(employee.userId, { ...map.get(employee.userId), ...employee }));
    return [...map.values()];
  }, [directory, employees]);

  const selected = useMemo(() => allUsers.find((item) => item.userId === selectedUser) ?? null, [allUsers, selectedUser]);
  const selectedHasRole = Boolean(selected && selectedRole && selected.roles.some((role) => role.roleKey === selectedRole));

  async function grant() {
    if (!selectedUser || !selectedRole) return;
    if (selectedHasRole) { setNotice("✓ This Operations role is already assigned."); return; }
    setBusy("grant"); setNotice("");
    try {
      const result = await api.post<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/operations/access/${selectedUser}/roles`, { roleKey: selectedRole });
      setNotice(result.actionState === "ALREADY_DONE" ? "✓ This Operations role was already assigned on the server." : "Operations role granted and audit logged.");
      await Promise.all([loadAccess(), searchDirectory(search)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not grant role.");
    } finally { setBusy(""); }
  }

  async function revoke(roleKey: string) {
    if (!selectedUser) return;
    setBusy(`revoke:${roleKey}`); setNotice("");
    try {
      const result = await api.request<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/operations/access/${selectedUser}/roles/${encodeURIComponent(roleKey)}`, { method: "DELETE" });
      setNotice(result.actionState === "ALREADY_DONE" ? "✓ That role had already been removed." : "Operations role revoked and audit logged.");
      await Promise.all([loadAccess(), searchDirectory(search)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not revoke role.");
    } finally { setBusy(""); }
  }

  return (
    <OpsShell active="/access">
      <main className="ops-v31-main ops-access-v7">
        <section className="ops-v33-domain-hero">
          <div><span className="ops-v31-kicker">EMPLOYEE ACCESS</span><h1>Least privilege by responsibility.</h1><p>Search the complete BazID directory, onboard Operations staff, assign responsibility-specific roles and revoke access with an auditable control trail.</p></div>
          <div className="ops-v33-hero-stat"><span>ASSIGNED STAFF</span><strong>{employees.length}</strong><small>{roles.length} role presets · {allUsers.length} directory results</small></div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <div className="ops-v4-access-grid">
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">BAZID DIRECTORY</span><h2>Find and onboard staff</h2><p>Search by name, email or user ID. Only active users can receive Operations roles.</p></div></div>
            <div className="ops-access-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search BazID users…" /></div>
            <div className="ops-v4-employee-list ops-access-directory">
              {allUsers.map((user) => (
                <button key={user.userId} className={selectedUser === user.userId ? "selected" : ""} onClick={() => setSelectedUser(user.userId)}>
                  <div><strong>{identity(user)}</strong><small>{user.email || user.userId} · {user.status}</small></div>
                  <span>{user.roles.length} role{user.roles.length === 1 ? "" : "s"}</span>
                </button>
              ))}
              {!allUsers.length ? <div className="ops-v31-empty">No BazID users match this search.</div> : null}
            </div>
          </section>

          <section className="ops-v31-panel">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">ROLE CONTROL</span><h2>{selected ? identity(selected) : "Select a user"}</h2><p>{selected?.email || "Choose a directory user to manage their Operations access."}</p></div></div>
            {selected ? <>
              <div className="ops-access-user-meta"><span>Status <b>{selected.status}</b></span>{selected.verificationLevel ? <span>Verification <b>{selected.verificationLevel}</b></span> : null}<span>Assigned roles <b>{selected.roles.length}</b></span></div>
              <div className="ops-v4-assigned-roles">
                {selected.roles.map((role) => <article key={role.assignmentId}><div><strong>{role.roleName}</strong><small>{role.roleKey}</small></div><button disabled={busy === `revoke:${role.roleKey}`} onClick={() => void revoke(role.roleKey)}>{busy === `revoke:${role.roleKey}` ? "Revoking…" : "Revoke"}</button></article>)}
                {!selected.roles.length ? <div className="ops-v31-empty">No Operations role assigned. Grant a role below to onboard this user.</div> : null}
              </div>
              <div className="ops-v4-role-grant"><select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>{roles.map((role) => <option key={role.key} value={role.key}>{role.name}</option>)}</select><button className={selectedHasRole ? "smart-done" : ""} disabled={busy === "grant" || selected.status !== "ACTIVE" || selectedHasRole} onClick={() => void grant()}>{busy === "grant" ? "Granting…" : selectedHasRole ? "✓ Role assigned" : "Grant role"}</button></div>
            </> : <div className="ops-v31-empty">Select an employee or search for a new BazID user.</div>}
          </section>

          <section className="ops-v31-panel ops-v4-role-catalog">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">ROLE CATALOG</span><h2>Permission boundaries</h2><p>Preset responsibilities keep privileged actions separated and reviewable.</p></div></div>
            {roles.map((role) => <details key={role.key}><summary><strong>{role.name}</strong><span>{role.permissions.length} permissions</span></summary><p>{role.description}</p><div>{role.permissions.map((permission) => <code key={permission}>{permission}</code>)}</div></details>)}
          </section>
        </div>
      </main>
    </OpsShell>
  );
}
