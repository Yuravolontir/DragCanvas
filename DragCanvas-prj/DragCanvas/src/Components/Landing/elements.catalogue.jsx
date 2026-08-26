/**
 * The one list of elements the toolbox shows.
 *
 * Three hand-maintained lists have to agree about which elements exist: the
 * resolver in CreateNewProject.jsx, the AI system prompt, and this file.
 * scripts/check-ai-catalogue.mjs compares all three and fails when they drift,
 * so a component added to the resolver cannot quietly fail to appear in the
 * panel.
 *
 * Rules the guard enforces, so they are worth knowing while editing:
 *   - `name` must match the resolver key exactly; it is the join column.
 *   - `icon` must be unique. Two elements drawn the same are two elements the
 *     user cannot tell apart.
 *   - `tip` must say something the label does not.
 *   - `group` must be one of ELEMENT_GROUPS.
 *
 * `element` is a function, not a value: Craft.js needs a fresh element per
 * insertion, and a shared instance would be reused across drops.
 *
 * A warning about `keywords`: Tailwind scans this file as plain text, so a
 * keyword that reads like a utility class makes Tailwind mint one. `collapse`
 * here once generated `.collapse { visibility: collapse }`, which hid every
 * Bootstrap navbar in the app. The names that clash are blocklisted in
 * tailwind.config.js - add to that list before adding a keyword like `hidden`
 * or `block`.
 */
import { Element } from '@craftjs/core';
import React from 'react';

import { Accordion } from './Accordion';
import { Badge } from './Badge';
import { Button } from './Button';
import { CTABanner } from './CTABanner';
import { Carousel } from './Carousel';
import { Columns } from './Columns';
import { Container } from './Container';
import { Divider } from './Divider';
import { Form } from './Form';
import { Heading } from './Heading';
import { Icon } from './Icon';
import { Image } from './Image';
import { Link } from './Link';
import { List } from './List';
import { LogoStrip } from './LogoStrip';
import { Map } from './Map';
import { NavbarElement } from './NavbarElement';
import { Newsletter } from './Newsletter';
import { Booking } from './Booking';
import { ProductCatalog } from './ProductCatalog';
import { Engagement } from './Engagement';
import { Tabs } from './Tabs';
import { Countdown } from './Countdown';
import { Pricing } from './Pricing';
import { Quote } from './Quote';
import { SocialLinks } from './SocialLinks';
import { Spacer } from './Spacer';
import { Stats } from './Stats';
import { TeamGrid } from './TeamGrid';
import { Testimonial } from './Testimonial';
import { Text } from './Text';
import { Timeline } from './Timeline';
import { Video } from './Video';

/** Display order of the groups in the panel. */
export const ELEMENT_GROUPS = ['Layout', 'Text', 'Media', 'Sections', 'Conversion'];

export const ELEMENTS = [
  // ---- Layout: arrange other things, hold no content of their own ----
  {
    name: 'Container',
    group: 'Layout',
    icon: 'dashboard',
    tip: 'A box to arrange things in',
    keywords: ['box', 'section', 'div', 'wrapper'],
    element: () => (
      <Element
        canvas
        is={Container}
        background={{ r: 78, g: 78, b: 78, a: 1 }}
        color={{ r: 0, g: 0, b: 0, a: 1 }}
        height="300px"
        width="300px"
      ></Element>
    ),
  },
  {
    name: 'Columns',
    group: 'Layout',
    icon: 'view_column',
    tip: 'Columns that stack on a phone',
    keywords: ['grid', 'row', 'two column'],
    // canvas, so things can be dropped into it
    element: () => <Element canvas is={Columns} />,
  },
  {
    name: 'Spacer',
    group: 'Layout',
    icon: 'height',
    tip: 'Empty space',
    keywords: ['gap', 'padding', 'space', 'whitespace'],
    element: () => <Spacer />,
  },
  {
    name: 'Divider',
    group: 'Layout',
    icon: 'horizontal_rule',
    tip: 'A rule between sections',
    keywords: ['rule', 'line', 'hr', 'separator'],
    element: () => <Divider />,
  },

  // ---- Text: words, differing by role ----
  {
    name: 'Heading',
    group: 'Text',
    icon: 'title',
    tip: 'A title, with a real heading level',
    keywords: ['h1', 'h2', 'title', 'headline'],
    element: () => <Heading />,
  },
  {
    name: 'Text',
    group: 'Text',
    // `title` belongs to Heading, which is what it means. Text had it too, so
    // the two elements element-library split apart were drawn identically.
    icon: 'text_fields',
    tip: 'A paragraph of body copy',
    keywords: ['paragraph', 'copy', 'body', 'p'],
    element: () => <Text fontSize="12" textAlign="left" text="Hi there" />,
  },
  {
    name: 'List',
    group: 'Text',
    icon: 'format_list_bulleted',
    tip: 'A bulleted or numbered list',
    keywords: ['bullets', 'ul', 'ol', 'numbered'],
    element: () => <List />,
  },
  {
    name: 'Quote',
    group: 'Text',
    icon: 'format_quote',
    tip: 'A pull quote',
    keywords: ['blockquote', 'pull quote'],
    element: () => <Quote />,
  },
  {
    name: 'Badge',
    group: 'Text',
    icon: 'label',
    tip: 'A small pill of text',
    keywords: ['pill', 'tag', 'chip'],
    element: () => <Badge />,
  },

  // ---- Media: content that is not words ----
  {
    name: 'Image',
    group: 'Media',
    icon: 'image',
    tip: 'A picture, uploaded or by URL',
    keywords: ['picture', 'photo', 'img'],
    element: () => <Image />,
  },
  {
    name: 'Video',
    group: 'Media',
    icon: 'play_circle',
    tip: 'YouTube, video file, or a background hero',
    keywords: ['youtube', 'embed', 'movie', 'background', 'hero', 'banner', 'loop', 'cover'],
    element: () => <Element canvas is={Video} />,
  },
  {
    name: 'Carousel',
    group: 'Media',
    icon: 'view_carousel',
    tip: 'Slides that rotate',
    keywords: ['slider', 'slideshow', 'gallery'],
    element: () => <Carousel />,
  },
  {
    name: 'Icon',
    group: 'Media',
    icon: 'star',
    tip: 'One Material symbol',
    keywords: ['symbol', 'glyph'],
    element: () => <Icon />,
  },
  {
    name: 'Map',
    group: 'Media',
    icon: 'map',
    tip: 'A location, with a pin',
    keywords: ['location', 'address', 'osm', 'leaflet'],
    element: () => <Map />,
  },

  // ---- Sections: whole bands you drop onto a page ----
  {
    name: 'Accordion',
    group: 'Sections',
    icon: 'expand_circle_down',
    tip: 'Questions that open and close',
    keywords: ['faq', 'collapse', 'expand', 'questions'],
    element: () => <Accordion />,
  },
  {
    name: 'Pricing',
    group: 'Sections',
    icon: 'payments',
    tip: 'Tiers, in columns that line up',
    keywords: ['plans', 'tiers', 'table', 'cost'],
    element: () => <Pricing />,
  },
  {
    name: 'Testimonial',
    group: 'Sections',
    // Quote keeps format_quote: this is a person vouching, not a pull quote.
    icon: 'reviews',
    tip: 'Somebody vouching for you',
    keywords: ['review', 'vouch', 'customer'],
    element: () => <Testimonial />,
  },
  {
    name: 'Stats',
    group: 'Sections',
    icon: 'bar_chart',
    tip: 'A row of numbers',
    keywords: ['numbers', 'metrics', 'counters', 'kpi'],
    element: () => <Stats />,
  },
  {
    name: 'TeamGrid',
    group: 'Sections',
    icon: 'groups',
    tip: 'The people behind it',
    keywords: ['people', 'staff', 'about', 'members'],
    element: () => <TeamGrid />,
  },
  {
    name: 'Timeline',
    group: 'Sections',
    icon: 'timeline',
    tip: 'Steps, in order',
    keywords: ['steps', 'history', 'process', 'roadmap'],
    element: () => <Timeline />,
  },
  {
    name: 'LogoStrip',
    group: 'Sections',
    // Carousel keeps view_carousel: this row is static, it does not rotate.
    icon: 'view_week',
    tip: 'A row of logos',
    keywords: ['logos', 'brands', 'clients', 'partners'],
    element: () => <LogoStrip />,
  },

  // ---- Conversion: move the visitor somewhere ----
  {
    name: 'Button',
    group: 'Conversion',
    icon: 'smart_button',
    tip: 'A call-to-action button',
    keywords: ['cta', 'click'],
    element: () => <Button />,
  },
  {
    name: 'Link',
    group: 'Conversion',
    icon: 'link',
    tip: 'Text that goes somewhere',
    keywords: ['anchor', 'url', 'href'],
    element: () => <Link />,
  },
  {
    name: 'CTABanner',
    group: 'Conversion',
    icon: 'campaign',
    tip: 'The ask, on a band of its own',
    keywords: ['cta', 'banner', 'callout'],
    element: () => <CTABanner />,
  },
  {
    name: 'Form',
    group: 'Conversion',
    icon: 'dynamic_form',
    tip: 'A contact form',
    keywords: ['contact', 'input', 'fields', 'email'],
    element: () => <Form />,
  },
  {
    name: 'Newsletter',
    group: 'Conversion',
    icon: 'mark_email_read',
    tip: 'Email signup with confirmation and unsubscribe',
    keywords: ['subscribe', 'mailing list', 'email updates'],
    element: () => <Newsletter />,
  },
  {
    name: 'Booking',
    group: 'Conversion',
    icon: 'calendar_month',
    tip: 'Appointment slots with email confirmation',
    keywords: ['appointment', 'reservation', 'schedule', 'calendar'],
    element: () => <Booking />,
  },
  {
    name: 'ProductCatalog',
    group: 'Conversion',
    icon: 'shopping_cart',
    tip: 'Products with a persistent cart and checkout',
    keywords: ['shop', 'store', 'products', 'ecommerce'],
    element: () => <ProductCatalog />,
  },
  {
    name: 'Engagement',
    group: 'Conversion',
    icon: 'thumb_up',
    tip: 'Moderated reviews, reactions or a poll',
    keywords: ['feedback', 'vote', 'survey', 'likes'],
    element: () => <Engagement />,
  },
  {
    name: 'Tabs',
    group: 'Sections',
    icon: 'tab',
    tip: 'Compact switchable content panels',
    keywords: ['panels', 'details'],
    element: () => <Tabs />,
  },
  {
    name: 'Countdown',
    group: 'Conversion',
    icon: 'timer',
    tip: 'Live deadline for an offer or event',
    keywords: ['deadline', 'sale', 'launch'],
    element: () => <Countdown />,
  },
  {
    name: 'SocialLinks',
    group: 'Conversion',
    icon: 'share',
    tip: 'Where else to find you',
    keywords: ['social', 'facebook', 'instagram', 'twitter'],
    element: () => <SocialLinks />,
  },
  {
    name: 'NavbarElement',
    group: 'Conversion',
    icon: 'web_asset',
    // The resolver key is NavbarElement; the panel has always called it
    // Navigation, which is what a user looking for one would search for.
    label: 'Navigation',
    tip: 'A navigation bar',
    keywords: ['navbar', 'menu', 'header', 'nav'],
    element: () => <NavbarElement />,
  },
];

/** What the panel prints under the icon. Falls back to the resolver key. */
export const labelOf = (entry) => entry.label || entry.name;

/**
 * Does this entry match what was typed? Matches the visible label, the tooltip
 * and the keywords, so "faq" finds Accordion and "slider" finds Carousel.
 */
export const matchesQuery = (entry, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [labelOf(entry), entry.name, entry.tip, ...(entry.keywords || [])]
    .join(' ')
    .toLowerCase()
    .includes(q);
};
