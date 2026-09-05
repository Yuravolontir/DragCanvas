import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "./NavBar";
import { apiFetch } from "./api.js";
import { useDialogs } from "./Components/useDialogs.jsx";
import SubmissionList from "./Components/SubmissionList.jsx";
import { formatDateTime } from "./utils/dates.js";
import "./ProjectOperations.css";

const TABS = [
  { id: "overview", label: "Overview", icon: "monitoring" },
  { id: "audience", label: "Audience", icon: "group" },
  { id: "activity", label: "Leads & bookings", icon: "inbox" },
  { id: "publishing", label: "Publishing", icon: "history" },
];

const DATE_FIELDS = new Set(["CreatedDate", "StartAt"]);

export default function ProjectOperations() {
  // The URL /projects/15/operations gives us projectId = "15".
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Data and general page state.
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Newsletter form state.
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Holds a unique name while a button action is running.
  // Examples: "newsletter", "review-12", or "version-4".
  const [busyAction, setBusyAction] = useState("");
  const { dialogs, alert, confirm } = useDialogs();

  // Load every section in parallel. One failed section should not hide the
  // sections that loaded successfully, so each request catches its own error.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const calls = {
      analytics: `/api/analytics/project/${projectId}`,
      subscribers: `/api/subscribers/project/${projectId}`,
      bookings: `/api/bookings/project/${projectId}`,
      engagement: `/api/engagement/project/${projectId}`,
      versions: `/api/publish/versions/${projectId}`,
      submissions: `/api/forms/project/${projectId}`,
    };
    const failures = [];
    try {
      const entries = await Promise.all(
        Object.entries(calls).map(async ([key, path]) => {
          try {
            const response = await apiFetch(path);
            return [key, response];
          } catch (loadError) {
            failures.push(`${key}: ${loadError.message}`);
            const emptyValue = key === "submissions" ? { submissions: [] } : [];
            return [key, emptyValue];
          }
        }),
      );
      setData(Object.fromEntries(entries));
      setError(failures.join("\n"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load().catch((loadError) => {
      setError(loadError.message);
      setLoading(false);
    });
  }, [load]);

  // Every button action needs the same three things: disable its button,
  // catch server errors, and enable the button again when it finishes.
  const runAction = async (actionName, action, successMessage) => {
    setBusyAction(actionName);
    try {
      await action();
      if (successMessage) {
        await alert({ ...successMessage, tone: "success" });
      }
    } catch (actionError) {
      await alert({
        title: "Something went wrong",
        message: actionError.message,
        tone: "error",
      });
    } finally {
      setBusyAction("");
    }
  };

  const moderateReview = (reviewId, newStatus) => {
    return runAction(`review-${reviewId}`, async () => {
      await apiFetch(`/api/engagement/project/${projectId}/${reviewId}`, {
        method: "PUT",
        body: { status: newStatus },
      });
      await load();
    });
  };

  // The unread count on the overview card had no way of ever going down: the
  // endpoint existed, and nothing called it.
  const markSubmissionRead = (submissionId) => {
    return runAction(`submission-${submissionId}`, async () => {
      await apiFetch(`/api/forms/project/${projectId}/${submissionId}/read`, {
        method: "PUT",
      });
      await load();
    });
  };

  const restoreVersion = async (versionId) => {
    const accepted = await confirm({
      title: "Publish this older version?",
      message: "The selected version will replace the version that is live now. You can still return to another saved version later.",
      confirmText: "Publish version",
      tone: "warning",
    });
    if (!accepted) return;
    await runAction(
      `version-${versionId}`,
      async () => {
        await apiFetch(`/api/publish/versions/${projectId}/${versionId}/rollback`, {
          method: "POST",
        });
        await load();
      },
      {
        title: "Version published",
        message: "The selected version is now live.",
      },
    );
  };

  const sendNewsletter = async (event) => {
    event.preventDefault();
    await runAction(
      "newsletter",
      async () => {
        await apiFetch(`/api/subscribers/project/${projectId}/send`, {
          method: "POST",
          body: { subject, message },
        });
        setSubject("");
        setMessage("");
      },
      {
        title: "Newsletter queued",
        message: "It will be sent to all active subscribers.",
      },
    );
  };

  // The API is allowed to be empty. These fallbacks let the JSX safely use
  // .map(), .filter(), and .length even before data arrives.
  const analytics = Array.isArray(data.analytics) ? data.analytics : [];
  const subscribers = Array.isArray(data.subscribers) ? data.subscribers : [];
  const bookings = Array.isArray(data.bookings) ? data.bookings : [];
  const versions = Array.isArray(data.versions) ? data.versions : [];
  const submissions = Array.isArray(data.submissions?.submissions)
    ? data.submissions.submissions
    : [];
  const reviews = Array.isArray(data.engagement)
    ? data.engagement.filter((row) => row.Kind === "review")
    : [];

  // Values used by the overview cards.
  const views = analytics.reduce((total, row) => total + Number(row.Views || 0), 0);
  const conversions = analytics.reduce((total, row) => total + Number(row.Conversions || 0), 0);
  const conversionRate = views ? Math.round((conversions / views) * 100) : 0;
  const activeSubscribers = subscribers.filter((row) => row.Status === "active").length;
  const pendingReviews = reviews.filter((row) => row.Status === "pending").length;

  // runAction names its busy button "submission-12"; the list wants just the id.
  const busyReadSubmissionId = busyAction.startsWith("submission-")
    ? Number(busyAction.slice("submission-".length))
    : null;

  // "3 responses · 1 unread" says the useful half first.
  const unreadSubmissions = Number(data.submissions?.unread || 0);
  const submissionDescription = [
    `${submissions.length} response${submissions.length === 1 ? "" : "s"} received`,
    unreadSubmissions ? `${unreadSubmissions} unread` : "",
  ].filter(Boolean).join(" · ");

  return (
    <div className="ops-page">
      <NavBar />
      {dialogs}
      <main className="ops-shell">
        <header className="ops-hero">
          <button
            className="ops-back"
            type="button"
            onClick={() => navigate("/my-projects")}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>
            My projects
          </button>
          <div className="ops-hero__row">
            <div>
              <p className="ops-eyebrow">Project #{projectId}</p>
              <h1>Project operations</h1>
              <p className="ops-subtitle">
                Track performance, manage your audience, and control what is live.
              </p>
            </div>
            <button
              className="ops-refresh"
              type="button"
              onClick={load}
              disabled={loading}
            >
              <span
                className={`material-symbols-outlined ${loading ? "ops-spin" : ""}`}
                aria-hidden="true"
              >
                refresh
              </span>
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </div>
        </header>

        {error && (
          <div className="ops-error" role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">
              warning
            </span>
            <div>
              <strong>Some data could not be loaded</strong>
              <pre>{error}</pre>
            </div>
            <button type="button" onClick={load}>Try again</button>
          </div>
        )}

        <nav className="ops-tabs" aria-label="Project operation sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        {loading && !Object.keys(data).length ? <LoadingState /> : <>
          {activeTab === "overview" && <div className="ops-tab-panel animate-fade-in-up">
            <div className="ops-metrics">
              <Metric icon="visibility" label="Views" value={views} hint="Last 30 days" tone="blue" />
              <Metric icon="ads_click" label="Conversions" value={conversions} hint="Completed actions" tone="violet" />
              <Metric icon="percent" label="Conversion rate" value={`${conversionRate}%`} hint="Conversions per view" tone="orange" />
              <Metric icon="person_add" label="Active subscribers" value={activeSubscribers} hint={`${subscribers.length} total`} tone="green" />
            </div>
            <section className="ops-card">
              <SectionHeading icon="pulse_alert" title="At a glance" description="Items that may need your attention." />
              <div className="ops-attention-grid">
                <Attention label="Unread form submissions" value={Number(data.submissions?.unread || 0)} icon="mark_email_unread" onClick={() => setActiveTab("activity")} />
                <Attention label="Upcoming bookings" value={bookings.length} icon="calendar_month" onClick={() => setActiveTab("activity")} />
                <Attention label="Reviews to moderate" value={pendingReviews} icon="rate_review" onClick={() => setActiveTab("audience")} />
                <Attention label="Published versions" value={versions.length} icon="history" onClick={() => setActiveTab("publishing")} />
              </div>
            </section>
          </div>}

          {activeTab === "audience" && <div className="ops-tab-panel ops-two-column animate-fade-in-up">
            <section className="ops-card">
              <SectionHeading icon="campaign" title="Send a newsletter" description={`Reach ${activeSubscribers} active subscriber${activeSubscribers === 1 ? "" : "s"}.`} />
              <form className="ops-form" onSubmit={sendNewsletter}>
                <label>Subject<input required maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What is this update about?" /></label>
                <label>Message<textarea required rows={7} maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a clear, useful update…" /></label>
                <div className="ops-form__footer"><span>{message.length}/5000</span><button className="ops-primary" disabled={!activeSubscribers || busyAction === "newsletter"}><span className="material-symbols-outlined" aria-hidden="true">send</span>{busyAction === "newsletter" ? "Sending…" : "Send newsletter"}</button></div>
              </form>
            </section>
            <section className="ops-card">
              <SectionHeading icon="group" title="Subscribers" description={`${activeSubscribers} active · ${subscribers.length} total`} />
              <DataTable rows={subscribers} columns={[{ key: "Email", label: "Email" }, { key: "Status", label: "Status", status: true }, { key: "CreatedDate", label: "Joined" }]} empty="No subscribers yet." />
            </section>
            <section className="ops-card ops-span-full">
              <SectionHeading icon="reviews" title="Review moderation" description={pendingReviews ? `${pendingReviews} waiting for review` : "You're all caught up."} />
              {!reviews.length ? <EmptyState icon="chat_bubble" text="No reviews yet." /> : <div className="ops-review-list">{reviews.map((row) => <article className="ops-review" key={row.Entry_ID}>
                <div className="ops-avatar" aria-hidden="true">{(row.Author || "?").charAt(0).toUpperCase()}</div>
                <div className="ops-review__body"><div className="ops-review__meta"><strong>{row.Author || "Anonymous"}</strong><Status value={row.Status} /></div><p>{row.Content}</p></div>
                {row.Status === "pending" && <div className="ops-review__actions"><button className="ops-approve" disabled={busyAction === `review-${row.Entry_ID}`} onClick={() => moderateReview(row.Entry_ID, "approved")}>Approve</button><button className="ops-reject" disabled={busyAction === `review-${row.Entry_ID}`} onClick={() => moderateReview(row.Entry_ID, "rejected")}>Reject</button></div>}
              </article>)}</div>}
            </section>
          </div>}

          {activeTab === "activity" && <div className="ops-tab-panel ops-stack animate-fade-in-up">
            <section className="ops-card">
              <SectionHeading icon="contact_mail" title="Form submissions" description={submissionDescription} />
              <SubmissionList
                rows={submissions}
                busyId={busyReadSubmissionId}
                onMarkRead={markSubmissionRead}
                emptyText="No form submissions yet."
              />
            </section>
            <section className="ops-card"><SectionHeading icon="calendar_month" title="Bookings" description={`${bookings.length} booking${bookings.length === 1 ? "" : "s"}`} /><DataTable rows={bookings} columns={[{ key: "StartAt", label: "Date & time" }, { key: "Name", label: "Customer" }, { key: "Email", label: "Email" }, { key: "Status", label: "Status", status: true }]} empty="No bookings yet." /></section>
          </div>}

          {activeTab === "publishing" && <div className="ops-tab-panel animate-fade-in-up"><section className="ops-card">
            <SectionHeading icon="history" title="Published versions" description="Restore an earlier version of your live site." />
            {!versions.length ? <EmptyState icon="cloud_off" text="No published versions yet." /> : <div className="ops-version-list">{versions.map((row, index) => <div className="ops-version" key={row.Version_ID}>
              <div className="ops-version__icon"><span className="material-symbols-outlined" aria-hidden="true">{index === 0 ? "language" : "history"}</span></div>
              <div><strong>{index === 0 ? "Latest publication" : `Version ${row.Version_ID}`}</strong><span>{formatDateTime(row.CreatedDate)}</span></div>
              {index === 0 ? <span className="ops-live"><i /> Current</span> : <button className="ops-secondary" disabled={busyAction === `version-${row.Version_ID}`} onClick={() => restoreVersion(row.Version_ID)}>{busyAction === `version-${row.Version_ID}` ? "Publishing…" : "Restore"}</button>}
            </div>)}</div>}
          </section></div>}
        </>}
      </main>
    </div>
  );
}

function Metric({ icon, label, value, hint, tone }) {
  return (
    <article className={`ops-metric ops-metric--${tone}`}>
      <div className="ops-metric__icon">
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

function SectionHeading({ icon, title, description }) {
  return (
    <div className="ops-section-heading">
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

function Attention({ label, value, icon, onClick }) {
  return (
    <button className="ops-attention" type="button" onClick={onClick}>
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <span
        className="material-symbols-outlined ops-attention__arrow"
        aria-hidden="true"
      >
        arrow_forward
      </span>
    </button>
  );
}

function Status({ value }) {
  const normalized = String(value || "unknown").toLowerCase();
  return (
    <span className={`ops-status ops-status--${normalized}`}>
      {normalized}
    </span>
  );
}

function DataTable({ rows, columns, empty }) {
  if (!rows.length) {
    return <EmptyState icon="inbox" text={empty} />;
  }

  const firstHundredRows = rows.slice(0, 100);

  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {firstHundredRows.map((row, index) => {
            const rowKey = row.Entry_ID
              || row.Submission_ID
              || row.Booking_ID
              || row.Order_ID
              || row.Email
              || index;

            return (
              <tr key={rowKey}>
                {columns.map((column) => {
                  const cellValue = row[column.key];
                  let content = String(cellValue ?? "—");

                  if (column.status) {
                    content = <Status value={cellValue} />;
                  } else if (DATE_FIELDS.has(column.key)) {
                    content = formatDateTime(cellValue);
                  }

                  return <td key={column.key}>{content}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length > 100 && (
        <p className="ops-table-note">
          Showing the first 100 of {rows.length} records.
        </p>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="ops-empty">
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      <p>{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="ops-loading" role="status" aria-live="polite">
      <span className="ops-loader" />
      <strong>Loading project data</strong>
      <p>Bringing your analytics and activity together…</p>
    </div>
  );
}
