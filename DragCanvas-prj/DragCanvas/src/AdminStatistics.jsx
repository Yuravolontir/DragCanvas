import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';

import { getToken } from './api.js';

const REPORTS_API_URL = import.meta.env.VITE_PY_API_URL || 'http://localhost:8000';

const CHARTS = [
  { title: 'Registrations by Month', path: '/api/charts/registrations' },
  { title: 'Projects per User', path: '/api/charts/projects-per-user' },
  { title: 'Published vs Draft', path: '/api/charts/published' },
  { title: 'Actions Breakdown', path: '/api/charts/actions' },
  { title: 'Project Sizes', path: '/api/charts/project-sizes' },
];

function authorizationHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export default function AdminStatistics() {
  const [summary, setSummary] = useState(null);
  const [projectsPerUser, setProjectsPerUser] = useState([]);
  const [chartUrls, setChartUrls] = useState({});
  const [error, setError] = useState(null);

  // Incrementing this value asks both effects below to fetch fresh data.
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    async function loadStatistics() {
      const token = getToken();
      if (!token) {
        setError('You need to be signed in to see the statistics.');
        return;
      }

      const requestOptions = { headers: authorizationHeaders(token) };

      try {
        const [summaryResponse, projectsResponse] = await Promise.all([
          fetch(`${REPORTS_API_URL}/api/stats/summary`, requestOptions),
          fetch(`${REPORTS_API_URL}/api/stats/projects-per-user`, requestOptions),
        ]);

        const accessWasDenied = summaryResponse.status === 401 || summaryResponse.status === 403;
        if (accessWasDenied) {
          setError('The statistics are available to administrators only.');
          return;
        }

        if (!summaryResponse.ok || !projectsResponse.ok) {
          setError('The statistics service answered with an error.');
          return;
        }

        const [summaryData, projectRows] = await Promise.all([
          summaryResponse.json(),
          projectsResponse.json(),
        ]);
        setSummary(summaryData);
        setProjectsPerUser(projectRows);
        setError(null);
      } catch {
        setError('Statistics service is not running (start it with: uvicorn main:app --port 8000)');
      }
    }

    loadStatistics();
  }, [refreshVersion]);

  /**
   * Chart endpoints return protected PNG files. An <img> cannot attach the JWT,
   * so JavaScript fetches each image with an Authorization header and gives the
   * browser a temporary local blob URL instead.
   */
  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    let cancelled = false;
    const createdObjectUrls = [];

    async function loadChart(chart) {
      try {
        const response = await fetch(`${REPORTS_API_URL}${chart.path}`, {
          headers: authorizationHeaders(token),
        });
        if (!response.ok) return;

        const imageBlob = await response.blob();
        const objectUrl = URL.createObjectURL(imageBlob);

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        createdObjectUrls.push(objectUrl);
        setChartUrls((previousUrls) => {
          const previousUrl = previousUrls[chart.path];
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          return { ...previousUrls, [chart.path]: objectUrl };
        });
      } catch {
        // The statistics request above already displays an unreachable-service error.
      }
    }

    CHARTS.forEach(loadChart);

    return () => {
      cancelled = true;
      createdObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [refreshVersion]);

  if (error) return <Alert variant="warning">{error}</Alert>;
  if (!summary) return <Spinner animation="border" />;

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <Button
          variant="outline-primary"
          onClick={() => setRefreshVersion((version) => version + 1)}
        >
          <span aria-hidden="true">↻</span> Refresh
        </Button>
      </div>

      <Row className="mb-4">
        {Object.entries(summary).map(([name, value]) => (
          <Col key={name}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h3>{value}</h3>
                <small className="text-muted">{name.replaceAll('_', ' ')}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        {CHARTS.map((chart) => (
          <Col md={6} key={chart.path} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header>{chart.title}</Card.Header>
              <Card.Body className="text-center">
                {chartUrls[chart.path] ? (
                  <img
                    src={chartUrls[chart.path]}
                    alt={chart.title}
                    style={{ maxWidth: '100%' }}
                  />
                ) : (
                  <Spinner animation="border" size="sm" />
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header>Projects per User (Top 10)</Card.Header>
        <Table responsive striped bordered hover className="mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th>Projects</th>
            </tr>
          </thead>
          <tbody>
            {projectsPerUser.map((row) => (
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
