import { Button, Form, Modal } from 'react-bootstrap';

const TEMPLATE_CATEGORIES = ['Landing Page', 'Portfolio', 'Blog', 'E-commerce'];

/** Collects project metadata before the editor saves the canvas. */
export default function SaveProjectModal({
  show,
  currentUser,
  projectName,
  projectDescription,
  saveAsTemplate,
  templateName,
  templateCategory,
  onProjectNameChange,
  onProjectDescriptionChange,
  onSaveAsTemplateChange,
  onTemplateNameChange,
  onTemplateCategoryChange,
  onSave,
  onClose,
}) {
  const canCreateTemplate = currentUser?.IsAdmin || currentUser?.IsSuperAdmin;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Save Project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Project Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter project name"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Project Description</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter project description"
            value={projectDescription}
            onChange={(event) => onProjectDescriptionChange(event.target.value)}
          />
        </Form.Group>

        {canCreateTemplate && (
          <Form.Group className="mt-3">
            <Form.Check
              type="checkbox"
              label="Save as Template (available to all users)"
              checked={saveAsTemplate}
              onChange={(event) => onSaveAsTemplateChange(event.target.checked)}
            />
            {saveAsTemplate && (
              <>
                <Form.Control
                  className="mt-2"
                  type="text"
                  placeholder="Template Name"
                  value={templateName}
                  onChange={(event) => onTemplateNameChange(event.target.value)}
                />
                <Form.Select
                  className="mt-2"
                  value={templateCategory}
                  onChange={(event) => onTemplateCategoryChange(event.target.value)}
                >
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </>
            )}
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onSave} disabled={!projectName}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
}
