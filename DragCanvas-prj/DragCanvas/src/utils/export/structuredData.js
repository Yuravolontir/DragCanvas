import { readAccordionRows, readPricingRows, readTeamRows } from '../elementRows.js';

/**
 * The schema.org description search engines read instead of guessing.
 *
 * Only four elements say anything a machine can use: a FAQ, a location, a price
 * list and a staff list. Everything else on the page is described well enough
 * by the markup itself.
 *
 * @returns {string} the <script> tag for the head, or an empty string
 */
export function structuredDataScript(serializedData, title, options) {
  const graph = [];

  for (const node of Object.values(serializedData || {})) {
    const type = node?.type?.resolvedName || node?.type;
    const props = node?.props || {};

    if (type === 'Accordion') {
      const mainEntity = readAccordionRows(props).filter((row) => row.question && row.answer)
        .map((row) => ({
          '@type': 'Question',
          name: row.question,
          acceptedAnswer: { '@type': 'Answer', text: row.answer },
        }));
      if (mainEntity.length) graph.push({ '@type': 'FAQPage', mainEntity });
    }

    if (type === 'Map') {
      graph.push({
        '@type': 'LocalBusiness',
        name: props.label || title || 'Business',
        ...(props.address ? { address: { '@type': 'PostalAddress', streetAddress: String(props.address) } } : {}),
        url: options.canonicalUrl || '{{DRAGCANVAS_SITE_URL}}',
        geo: { '@type': 'GeoCoordinates', latitude: Number(props.lat), longitude: Number(props.lng) },
      });
    }

    if (type === 'Pricing') {
      const offers = readPricingRows(props).map((tier) => ({
        '@type': 'Offer',
        name: tier.name,
        price: tier.price.replace(/[^0-9.,]/g, '').replace(',', '.') || '0',
      }));
      if (offers.length) graph.push({ '@type': 'Product', name: title || 'Services', offers });
    }

    if (type === 'TeamGrid') {
      const employee = readTeamRows(props).filter((person) => person.name)
        .map((person) => ({ '@type': 'Person', name: person.name, jobTitle: person.role }));
      if (employee.length) graph.push({ '@type': 'Organization', name: title || 'Organization', employee });
    }
  }

  if (graph.length === 0) return '';

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  // The escaped < keeps a stray </script> inside somebody's text from closing
  // the tag early.
  return `\n  <script type="application/ld+json">${jsonLd.replace(/</g, '\\u003c')}</script>`;
}
