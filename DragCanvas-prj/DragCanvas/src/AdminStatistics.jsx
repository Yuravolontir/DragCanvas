import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Spinner, Alert, Button } from 'react-bootstrap';

const PY_API = 'http://localhost:8000';

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

  useEffect(() => {
    async function loadStats() {
      try {
        const summaryRes = await fetch(`${PY_API}/api/stats/summary`);
        const summaryData = await summaryRes.json();
        setSummary(summaryData);

        const projectsRes = await fetch(`${PY_API}/api/stats/projects-per-user`);
        const projectsData = await projectsRes.json();
        setProjectsPerUser(projectsData);
      } catch {
        setError('Statistics service is not running (start it with: uvicorn main:app --port 8000)');
      }
    }

    loadStats();
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
                <img src={`${PY_API}${chart.url}?t=${refreshKey}`} alt={chart.title} style={{
maxWidth: '100%' }} />
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