"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import {
  businessRequest,
  useBusinessOrganizations,
} from "../lib/business";

type TeamMember = {
  id: string;
  userId: string;
  displayName: string | null;
  primaryEmail: string | null;
  verificationLevel: string;
  title: string | null;
  status: string;
  roleKey: string;
  permissions: string[];
  branchIds: string[];
};

type Invitation = {
  id: string;
  email: string;
  roleKey: string;
  branchIds: string[];
  permissions: string[];
  expiresAt: string;
};

type Branch = {
  id: string;
  name: string;
  code: string;
};

type TeamResponse = {
  members: TeamMember[];
  invitations: Invitation[];
  branches: Branch[];
  roleTemplates: Array<{
    key: string;
    permissions: string[];
  }>;
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  FINANCE: "Finance",
  CATALOG: "Catalogue",
  OPERATIONS: "Operations",
  STAFF: "Staff",
  CUSTOM: "Custom",
};

export default function TeamPage() {
  const {
    organizations,
    organization,
    organizationId,
    setOrganizationId,
    loading,
  } = useBusinessOrganizations();

  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [form, setForm] = useState({
    email: "",
    roleKey: "STAFF",
  });
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [customPermissions, setCustomPermissions] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) return;
    try {
      const result = await businessRequest<TeamResponse>(
        `/v1/business/advanced/organizations/${organizationId}/team`,
      );
      setTeam(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load team");
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeMembers = useMemo(
    () => team?.members.filter((member) => member.status === "ACTIVE") ?? [],
    [team],
  );

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    setBusy("invite");
    setError("");
    setNotice("");
    setInviteUrl("");

    try {
      const result = await businessRequest<{
        inviteUrl: string;
        invitation: { email: string };
      }>(
        `/v1/business/advanced/organizations/${organizationId}/team/invitations`,
        "POST",
        {
          email: form.email,
          roleKey: form.roleKey,
          branchIds: selectedBranches,
          permissions:
            form.roleKey === "CUSTOM"
              ? customPermissions
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean)
              : [],
        },
      );

      const absolute = new URL(result.inviteUrl, window.location.origin).toString();
      setInviteUrl(absolute);
      setNotice(
        `Invitation created for ${result.invitation.email}. Share the invite link with that BazID user.`,
      );
      setForm({ email: "", roleKey: "STAFF" });
      setSelectedBranches([]);
      setCustomPermissions("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not invite team member");
    } finally {
      setBusy("");
    }
  }

  async function updateRole(member: TeamMember, roleKey: string) {
    setBusy(member.id);
    setError("");

    try {
      await businessRequest(
        `/v1/business/advanced/organizations/${organizationId}/team/members/${member.id}`,
        "PATCH",
        {
          roleKey,
          permissions: roleKey === "CUSTOM" ? member.permissions : [],
          branchIds: member.branchIds,
        },
      );
      setNotice(`${member.displayName ?? member.primaryEmail ?? "Member"} is now ${ROLE_LABELS[roleKey] ?? roleKey}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update member");
    } finally {
      setBusy("");
    }
  }

  async function removeMember(member: TeamMember) {
    const confirmed = window.confirm(
      `Remove ${member.displayName ?? member.primaryEmail ?? "this member"} from ${organization?.displayName}?`,
    );
    if (!confirmed) return;

    setBusy(member.id);
    setError("");

    try {
      await businessRequest(
        `/v1/business/advanced/organizations/${organizationId}/team/members/${member.id}`,
        "DELETE",
      );
      setNotice("Team member removed.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove member");
    } finally {
      setBusy("");
    }
  }

  async function transferOwnership(member: TeamMember) {
    const confirmed = window.confirm(
      `Transfer ownership of ${organization?.displayName} to ${member.displayName ?? member.primaryEmail}? You will become an Admin.`,
    );
    if (!confirmed) return;

    setBusy(member.id);
    setError("");

    try {
      await businessRequest(
        `/v1/business/advanced/organizations/${organizationId}/team/members/${member.id}/transfer-ownership`,
        "POST",
        {},
      );
      setNotice("Business ownership transferred.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not transfer ownership");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <main className="business-control-main">Loading team…</main>;
  }

  return (
    <div className="business-control-shell">
      <BusinessHeader
        organization={organization}
        organizations={organizations}
        organizationId={organizationId}
        setOrganizationId={setOrganizationId}
        active="team"
      />

      <main className="business-control-main">
        <section className="business-page-heading">
          <span className="business-kicker">TEAM & ACCESS</span>
          <h1>Staff are BazID users. Access belongs to the business.</h1>
          <p>
            Invite staff by BazID email, assign a business role, limit them to
            branches and protect the owner role from accidental removal.
          </p>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}
        {notice ? <div className="business-notice">{notice}</div> : null}

        {inviteUrl ? (
          <div className="business-secret-box">
            <span>INVITATION LINK</span>
            <code>{inviteUrl}</code>
            <button
              type="button"
              className="business-secondary-button"
              onClick={() => void (async () => { await navigator.clipboard.writeText(inviteUrl); setCopiedInvite(true); setNotice("✓ Invitation link copied."); window.setTimeout(() => setCopiedInvite(false), 1800); })()}
              disabled={copiedInvite}
            >
              {copiedInvite ? "✓ Copied" : "Copy invite link"}
            </button>
          </div>
        ) : null}

        <section className="business-control-kpis">
          <article>
            <span>ACTIVE MEMBERS</span>
            <strong>{activeMembers.length}</strong>
            <small>current staff access</small>
          </article>
          <article>
            <span>PENDING INVITES</span>
            <strong>{team?.invitations.length ?? 0}</strong>
            <small>awaiting BazID acceptance</small>
          </article>
          <article>
            <span>OWNERS</span>
            <strong>
              {activeMembers.filter((member) => member.roleKey === "OWNER").length}
            </strong>
            <small>last owner is protected</small>
          </article>
          <article>
            <span>BRANCHES</span>
            <strong>{team?.branches.length ?? 0}</strong>
            <small>available for access assignment</small>
          </article>
        </section>

        <div className="business-settings-grid">
          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">MEMBERS</span>
                <h2>Organization access</h2>
              </div>
              <span className="business-soft-pill">
                {activeMembers.length} active
              </span>
            </div>

            <div className="business-team-advanced-list">
              {activeMembers.map((member) => (
                <article key={member.id}>
                  <div className="business-avatar">
                    {(member.displayName ?? member.primaryEmail ?? "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div className="business-member-identity">
                    <strong>{member.displayName ?? "BazID member"}</strong>
                    <small>
                      {member.primaryEmail ?? "No primary email"} ·{" "}
                      {member.verificationLevel}
                    </small>
                  </div>
                  <select
                    value={member.roleKey}
                    disabled={busy === member.id}
                    onChange={(event) =>
                      void updateRole(member, event.target.value)
                    }
                  >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="business-inline-actions">
                    {member.roleKey !== "OWNER" ? (
                      <button
                        disabled={busy === member.id}
                        onClick={() => void transferOwnership(member)}
                      >
                        Make owner
                      </button>
                    ) : null}
                    <button
                      disabled={busy === member.id}
                      onClick={() => void removeMember(member)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="business-panel">
            <span className="business-kicker">INVITE STAFF</span>
            <h2>Add a BazID user.</h2>
            <p className="business-panel-copy">
              The staff member signs in with the matching BazID email and
              accepts the invite. Business roles do not alter their personal
              BazID account.
            </p>

            <form className="business-form" onSubmit={invite}>
              <label className="wide">
                BazID email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>

              <label className="wide">
                Role
                <select
                  value={form.roleKey}
                  onChange={(event) =>
                    setForm({ ...form, roleKey: event.target.value })
                  }
                >
                  {Object.entries(ROLE_LABELS)
                    .filter(([key]) => key !== "OWNER")
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>

              {form.roleKey === "CUSTOM" ? (
                <label className="wide">
                  Custom permissions
                  <input
                    value={customPermissions}
                    onChange={(event) =>
                      setCustomPermissions(event.target.value)
                    }
                    placeholder="orders.manage, inventory.manage"
                  />
                </label>
              ) : null}

              {team?.branches.length ? (
                <fieldset className="business-branch-permissions wide">
                  <legend>Branch access</legend>
                  {team.branches.map((branch) => (
                    <label key={branch.id}>
                      <input
                        type="checkbox"
                        checked={selectedBranches.includes(branch.id)}
                        onChange={(event) =>
                          setSelectedBranches((current) =>
                            event.target.checked
                              ? [...current, branch.id]
                              : current.filter((id) => id !== branch.id),
                          )
                        }
                      />
                      {branch.name} · {branch.code}
                    </label>
                  ))}
                  <small>
                    Leave all unchecked for organization-wide branch access.
                  </small>
                </fieldset>
              ) : null}

              <button
                className="business-primary-button wide"
                disabled={busy === "invite"}
              >
                {busy === "invite" ? "Creating invite…" : "Invite team member"}
              </button>
            </form>
          </section>
        </div>

        <section className="business-panel">
          <span className="business-kicker">ROLE MODEL</span>
          <h2>Recommended access boundaries</h2>
          <div className="business-role-grid">
            {team?.roleTemplates.map((role) => (
              <article key={role.key}>
                <strong>{ROLE_LABELS[role.key] ?? role.key}</strong>
                <span>
                  {role.permissions.includes("*")
                    ? "Full business administration"
                    : role.permissions.length
                      ? role.permissions.join(" · ")
                      : "Choose custom permissions"}
                </span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
