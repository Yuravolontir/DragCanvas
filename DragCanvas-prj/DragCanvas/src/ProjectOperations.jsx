import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import NavBar from './NavBar';
import { apiFetch } from './api.js';

const box = { background: 'var(--surface)', border: '1px solid var(--outline-light)', borderRadius: 16, padding: 20 };
const button = { border: 0, borderRadius: 10, padding: '10px 16px', background: 'var(--primary)', color: 'white', cursor: 'pointer' };

export default function ProjectOperations() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const calls = {
      analytics: `/api/analytics/project/${projectId}`,
      subscribers: `/api/subscribers/project/${projectId}`,
      bookings: `/api/bookings/project/${projectId}`,
      orders: `/api/commerce/orders/${projectId}`,
      engagement: `/api/engagement/project/${projectId}`,
      versions: `/api/publish/versions/${projectId}`,
      submissions: `/api/forms/project/${projectId}`,
      stripe: `/api/commerce/stripe/status/${projectId}`,
    };
    const failures = [];
    const entries = await Promise.all(Object.entries(calls).map(async ([key, path]) => {
      try { return [key, await apiFetch(path)]; }
      catch (loadError) { failures.push(`${key}: ${loadError.message}`); return [key, key === 'stripe' ? null : []]; }
    }));
    setData(Object.fromEntries(entries));
    setError(failures.join('\n'));
  }, [projectId]);

  useEffect(() => { Promise.resolve().then(load).catch((loadError) => setError(loadError.message)); }, [load]);

  const connectStripe = async () => {
    setBusy(true); setError('');
    try {
      const result = await apiFetch(`/api/commerce/stripe/connect/${projectId}`, { method: 'POST' });
      window.location.href = result.authorizeUrl;
    } catch (connectError) { setError(connectError.message); setBusy(false); }
  };
  const disconnectStripe = async () => {
    if (!window.confirm('Disconnect Stripe from this project? New checkouts will stop working.')) return;
    setBusy(true);
    try { await apiFetch(`/api/commerce/stripe/${projectId}`, { method: 'DELETE' }); await load(); }
    catch (disconnectError) { setError(disconnectError.message); }
    finally { setBusy(false); }
  };
  const moderate = async (id, status) => { await apiFetch(`/api/engagement/project/${projectId}/${id}`, { method: 'PUT', body: { status } }); await load(); };
  const rollback = async (id) => { if (!window.confirm('Publish this older version?')) return; await apiFetch(`/api/publish/versions/${projectId}/${id}/rollback`, { method: 'POST' }); await load(); };
  const send = async (event) => { event.preventDefault(); await apiFetch(`/api/subscribers/project/${projectId}/send`, { method: 'POST', body: { subject, message } }); setSubject(''); setMessage(''); window.alert('Newsletter queued'); };

  const analytics = Array.isArray(data.analytics) ? data.analytics : [];
  const views = analytics.reduce((total, row) => total + Number(row.Views || 0), 0);
  const conversions = analytics.reduce((total, row) => total + Number(row.Conversions || 0), 0);
  const reviews = (data.engagement || []).filter((row) => row.Kind === 'review');
  const stripeResult = searchParams.get('stripe');

  return <><NavBar /><main style={{ maxWidth: 1180, margin: '32px auto', padding: '0 20px', display: 'grid', gap: 18 }}>
    <div><button onClick={() => navigate('/my-projects')}>← Projects</button><h1>Project operations</h1>{error && <pre style={{ color: '#b42318', whiteSpace: 'pre-wrap' }}>{error}</pre>}</div>
    <section style={box}>
      <h2>Stripe payments</h2>
      {stripeResult === 'connected' && <p style={{ color: '#16803c' }}>Stripe account connected successfully.</p>}
      {stripeResult === 'cancelled' && <p>Stripe connection was cancelled.</p>}
      {stripeResult === 'error' && <p style={{ color: '#b42318' }}>Stripe could not be connected. Please try again.</p>}
      {data.stripe === undefined ? <p>Loading payment settings…</p> : data.stripe === null ? <p>Payment settings could not be loaded.</p> : !data.stripe.configured ? <p>The platform administrator must set STRIPE_SECRET_KEY and STRIPE_CONNECT_CLIENT_ID on the server.</p> : data.stripe.connected ? <div>
        <p><strong>Connected:</strong> {data.stripe.accountId} · {data.stripe.livemode ? 'live mode' : 'test mode'}</p>
        <button disabled={busy} onClick={disconnectStripe} style={{ ...button, background: '#b42318' }}>Disconnect Stripe</button>
      </div> : <div>
        <p>Connect a Stripe account to accept payments from the Product Catalog element. Card data never passes through DragCanvas.</p>
        <button disabled={busy} onClick={connectStripe} style={button}>{busy ? 'Opening Stripe…' : 'Connect Stripe'}</button>
      </div>}
    </section>
    <section style={box}><h2>Last 30 days</h2><p style={{ fontSize: 28 }}>{views} views · {conversions} conversions · {views ? Math.round(conversions / views * 100) : 0}%</p></section>
    <section style={box}><h2>Form submissions</h2><Simple rows={data.submissions?.submissions || []} fields={['CreatedDate', 'Data']} /></section>
    <section style={box}><h2>Subscribers ({(data.subscribers || []).filter((row) => row.Status === 'active').length} active)</h2><form onSubmit={send} style={{ display: 'grid', gap: 8, maxWidth: 600 }}><input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Newsletter subject" /><textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" /><button>Send to active subscribers</button></form><Simple rows={data.subscribers || []} fields={['Email', 'Status', 'CreatedDate']} /></section>
    <section style={box}><h2>Bookings</h2><Simple rows={data.bookings || []} fields={['StartAt', 'Name', 'Email', 'Status']} /></section>
    <section style={box}><h2>Orders</h2><Simple rows={data.orders || []} fields={['Order_ID', 'CustomerEmail', 'AmountMinor', 'Currency', 'Status', 'CreatedDate']} /></section>
    <section style={box}><h2>Review moderation</h2>{reviews.map((row) => <div key={row.Entry_ID} style={{ padding: 12, borderBottom: '1px solid #ddd' }}><strong>{row.Author}</strong><p>{row.Content}</p><small>{row.Status}</small>{row.Status === 'pending' && <span> <button onClick={() => moderate(row.Entry_ID, 'approved')}>Approve</button> <button onClick={() => moderate(row.Entry_ID, 'rejected')}>Reject</button></span>}</div>)}</section>
    <section style={box}><h2>Published versions</h2>{(data.versions || []).map((row) => <div key={row.Version_ID} style={{ display: 'flex', gap: 12, padding: 8 }}><span>{new Date(row.CreatedDate).toLocaleString()}</span><button onClick={() => rollback(row.Version_ID)}>Rollback</button></div>)}</section>
  </main></>;
}

function Simple({ rows, fields }) {
  if (!rows.length) return <p style={{ opacity: .65 }}>Nothing here yet.</p>;
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{fields.map((field) => <th key={field} style={{ textAlign: 'left', padding: 8 }}>{field}</th>)}</tr></thead><tbody>{rows.slice(0, 100).map((row, index) => <tr key={row.Entry_ID || row.Submission_ID || row.Booking_ID || row.Order_ID || index}>{fields.map((field) => <td key={field} style={{ padding: 8, borderTop: '1px solid #eee' }}>{typeof row[field] === 'object' ? JSON.stringify(row[field]) : String(row[field] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
