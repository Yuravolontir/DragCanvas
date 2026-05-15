import { getProjectsByUserId, getProjectById, saveProject, deleteProject } from './project.model.js';

export async function handleGetProjectsByUser(req, res) {
  try {
    const projects = await getProjectsByUserId(req.params.userId);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function handleGetProjectById(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const project = await getProjectById(req.params.projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function handleSaveProject(req, res) {
  try {
    const projectId = await saveProject(req.body);
    if (!projectId) {
      return res.status(400).json({ error: 'Failed to save project' });
    }
    res.status(200).json({ projectId, message: 'Project saved successfully' });
  } catch (error) {
    if (error.message === 'Maximum projects limit reached') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function handleDeleteProject(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const deleted = await deleteProject(req.params.projectId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
