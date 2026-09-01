import SitePreview from './SitePreview.jsx';

/**
 * A gallery template, drawn as the site it is.
 *
 * Everything about how that is done lives in SitePreview, which the project
 * cards use too. This is only the pair of column names a template happens to
 * store its design and its old thumbnail under.
 */
export default function TemplatePreview({ template, height = 1.25, className = '' }) {
  return (
    <SitePreview
      endpoint={`/api/templates/${template.Template_ID}`}
      designKey="TemplateData"
      name={template.TemplateName}
      fallbackSrc={template.ThumbnailURL}
      height={height}
      className={className}
    />
  );
}
