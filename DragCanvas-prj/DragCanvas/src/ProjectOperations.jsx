import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from './NavBar';
import { apiFetch } from './api.js';
import { useDialogs } from './Components/useDialogs.jsx';

const box = { background: 'var(--surface)', border: '1px solid var(--outline-light)', borderRadius: 16, padding: 20 };

export default function ProjectOperations() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { dialogs, alert, confirm } = useDialogs();

  const load = useCallback(async () => {
    const calls = {
      analytics: `/api/analytics/project/${projectId}`,
      subscribers: `/api/subscribers/project/${projectId}`,
      bookings: `/api/bookings/project/${projectId}`,
      engagement: `/api/engagement/project/${projectId}`,
      versions: `/api/publish/versions/${projectId}`,
      submissions: `/api/forms/project/${projectId}`,
    };
    const failures = [];
    const entries = await Promise.all(Object.entries(calls).map(async ([key, path]) => {
      try { return [key, await apiFetch(path)]; }
      catch (loadError) { failures.push(`${key}: ${loadError.message}`); return [key, []]; }
    }));
    setData(Object.fromEntries(entries));
    setError(failures.join('\n'));
  }, [projectId]);

  useEffect(() => { Promise.resolve().then(load).catch((loadError) => setError(loadError.message)); }, [load]);

  const moderate = async (id, status) => { await apiFetch(`/api/engagement/project/${projectId}/${id}`, { method: 'PUT', body: { status } }); await load(); };
  const rollback = async (id) => { if (!(await confirm({ title: 'Publish this older version?', message: 'The selected version will become the live site.', confirmText: 'Publish version', tone: 'warning' }))) return; await apiFetch(`/api/publish/versions/${projectId}/${id}/rollback`, { method: 'POST' }); await load(); };
  const send = async (event) => { event.preventDefault(); await apiFetch(`/api/subscribers/project/${projectId}/send`, { method: 'POST', body: { subject, message } }); setSubject(''); setMessage(''); await alert({ title: 'Newsletter queued', message: 'It will be sent to active subscribers.', tone: 'success' }); };

  const analytics = Array.isArray(data.analytics) ? data.analytics : [];
  const views = analytics.reduce((total, row) => total + Number(row.Views || 0), 0);
  const conversions = analytics.reduce((total, row) => total + Number(row.Conversions || 0), 0);
  const reviews = (data.engagement || []).filter((row) => row.Kind === 'review');

  return <><NavBar />{dialogs}<main style={{ maxWidth: 1180, margin: '32px auto', padding: '0 20px', display: 'grid', gap: 18 }}>
    <div><button onClick={() => navigate('/my-projects')}>← Projects</button><h1>Project operations</h1>{error && <pre style={{ color: '#b42318', whiteSpace: 'pre-wrap' }}>{error}</pre>}</div>
    <section style={box}><h2>Last 30 days</h2><p style={{ fontSize: 28 }}>{views} views · {conversions} conversions · {views ? Math.round(conversions / views * 100) : 0}%</p></section>
    <section style={box}><h2>Form submissions</h2><Simple rows={data.submissions?.submissions || []} fields={['CreatedDate', 'Data']} /></section>
    <section style={box}><h2>Subscribers ({(data.subscribers || []).filter((row) => row.Status === 'active').length} active)</h2><form onSubmit={send} style={{ display: 'grid', gap: 8, maxWidth: 600 }}><input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Newsletter subject" /><textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" /><button>Send to active subscribers</button></form><Simple rows={data.subscribers || []} fields={['Email', 'Status', 'CreatedDate']} /></section>
    <section style={box}><h2>Bookings</h2><Simple rows={data.bookings || []} fields={['StartAt', 'Name', 'Email', 'Status']} /></section>
    <section style={box}><h2>Review moderation</h2>{reviews.map((row) => <div key={row.Entry_ID} style={{ padding: 12, borderBottom: '1px solid #ddd' }}><strong>{row.Author}</strong><p>{row.Content}</p><small>{row.Status}</small>{row.Status === 'pending' && <span> <button onClick={() => moderate(row.Entry_ID, 'approved')}>Approve</button> <button onClick={() => moderate(row.Entry_ID, 'rejected')}>Reject</button></span>}</div>)}</section>
    <section style={box}><h2>Published versions</h2>{(data.versions || []).map((row) => <div key={row.Version_ID} style={{ display: 'flex', gap: 12, padding: 8 }}><span>{new Date(row.CreatedDate).toLocaleString()}</span><button onClick={() => rollback(row.Version_ID)}>Rollback</button></div>)}</section>
  </main></>;
}

function Simple({ rows, fields }) {
  if (!rows.length) return <p style={{ opacity: .65 }}>Nothing here yet.</p>;
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{fields.map((field) => <th key={field} style={{ textAlign: 'left', padding: 8 }}>{field}</th>)}</tr></thead><tbody>{rows.slice(0, 100).map((row, index) => <tr key={row.Entry_ID || row.Submission_ID || row.Booking_ID || row.Order_ID || index}>{fields.map((field) => <td key={field} style={{ padding: 8, borderTop: '1px solid #eee' }}>{typeof row[field] === 'object' ? JSON.stringify(row[field]) : String(row[field] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
