import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Spinner, Alert, Button } from 'react-bootstrap';
import { getToken } from './api.js';

 const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:8000';

const CHARTS = [
{ title: 'Registrations by Month', url: '/api/charts/registrations' },
{ title: 'Projects per User', url: '/api/charts/projects-per-user' },
{ title: 'Published vs Draft', url: '/api/charts/published' },
{ title: 'Actions Breakdown', url: '/api/charts/actions' },
{ title: 'Project Sizes', url: '/api/charts/project-sizes' },
];

export default function AdminStatistics() {
const [summary, setSummary] = useState(null);
const [projectsPerUser, setProjectsPerUser] = useState([]);
const [error, setError] = useState(null);
const [refreshKey, setRefreshKey] = useState(0);
// chart url -> blob: URL. Charts used to be plain <img src="...?token=jwt">,
// which put the token in server logs, browser history and any copied link.
const [chartUrls, setChartUrls] = useState({});

  useEffect(() => {
    /**
     * The reports service verifies the same JWT the Node API issues, so the
     * token travels with every request. It used to answer anyone who knew the
     * address, with CORS wide open.
     */
    async function loadStats() {
      const token = getToken();
      if (!token) {
        setError('You need to be signed in to see the statistics.');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [summaryRes, projectsRes] = await Promise.all([
          fetch(`${PY_API}/api/stats/summary`, { headers }),
          fetch(`${PY_API}/api/stats/projects-per-user`, { headers }),
        ]);

        if (summaryRes.status === 401 || summaryRes.status === 403) {
          setError('The statistics are available to administrators only.');
          return;
        }
        if (!summaryRes.ok || !projectsRes.ok) {
          setError('The statistics service answered with an error.');
          return;
        }

        setSummary(await summaryRes.json());
        setProjectsPerUser(await projectsRes.json());
        setError(null);
      } catch {
        setError('Statistics service is not running (start it with: uvicorn main:app --port 8000)');
      }
    }

    loadStats();
  }, [refreshKey]);

  /**
   * Charts are PNGs behind the same admin check, and an <img> cannot send an
   * Authorization header - which is why the token used to ride in the query
   * string. Fetching them here and handing the <img> a blob: URL keeps the
   * token in the header where it belongs.
   *
   * Every object URL holds its blob until it is revoked, and the Refresh button
   * makes a new set each time, so the previous ones are released on replacement
   * and on unmount.
   */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    const created = [];

    // In parallel, and each chart appears as soon as it arrives
    CHARTS.forEach(async (chart) => {
      try {
        const res = await fetch(`${PY_API}${chart.url}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const objectUrl = URL.createObjectURL(await res.blob());
        if (cancelled) { URL.revokeObjectURL(objectUrl); return; }
        created.push(objectUrl);
        setChartUrls(prev => {
          if (prev[chart.url]) URL.revokeObjectURL(prev[chart.url]);
          return { ...prev, [chart.url]: objectUrl };
        });
      } catch {
        // loadStats above already reports the service being unreachable
      }
    });

    return () => {
      cancelled = true;
      created.forEach(URL.revokeObjectURL);
    };
  }, [refreshKey]);

if (error) return <Alert variant="warning">{error}</Alert>;
if (!summary) return <Spinner animation="border" />;

return (
    <div>
    {/* Refresh button */}
    <div className="d-flex justify-content-end mb-3">
      <Button variant="outline-primary" onClick={() => setRefreshKey(refreshKey + 1)}>
        🔄 Refresh
      </Button>
    </div>

    {/* Summary cards */}
    <Row className="mb-4">
        {Object.entries(summary).map(([key, value]) => (
        <Col key={key}>
            <Card className="text-center shadow-sm">
            <Card.Body>
                <h3>{value}</h3>
                <small className="text-muted">{key.replaceAll('_', ' ')}</small>
            </Card.Body>
            </Card>
        </Col>
        ))}
    </Row>

    {/* Charts from Python/matplotlib */}
    <Row>
        {CHARTS.map(chart => (
        <Col md={6} key={chart.url} className="mb-4">
            <Card className="shadow-sm">
            <Card.Header>{chart.title}</Card.Header>
            <Card.Body className="text-center">
                {chartUrls[chart.url]
                  ? <img src={chartUrls[chart.url]} alt={chart.title} style={{ maxWidth: '100%' }} />
                  : <Spinner animation="border" size="sm" />}
            </Card.Body>
            </Card>
        </Col>
        ))}
    </Row>

    {/* Table example */}
    <Card className="shadow-sm mb-4">
        <Card.Header>Projects per User (Top 10)</Card.Header>
        <Table striped bordered hover className="mb-0">
        <thead>
            <tr><th>User</th><th>Projects</th></tr>
        </thead>
        <tbody>
            {projectsPerUser.map(row => (
            <tr key={row.UserName}>
                <td>{row.UserName}</td>
                <td>{row.project_count}</td>
            </tr>
            ))}
        </tbody>
        </Table>
    </Card>
    </div>
);
}