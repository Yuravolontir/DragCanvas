import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { createTheme, ThemeProvider } from '@mui/material';
import NavBar from './NavBar';
import LoadProjectOnMount from './LoadProjectOnMount';
import * as Landing from './Components/Landing';
import { clipFor } from './utils/stockVideo.js';

const theme = createTheme({ typography: { fontFamily: ['Plus Jakarta Sans', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(',') }, palette: { primary: { main: '#0060ac' }, secondary: { main: '#a93349' } } });
const resolver = {
  Container: Landing.Container, Text: Landing.Text, Custom1: Landing.Custom1, Custom2: Landing.Custom2,
  Custom2VideoDrop: Landing.Custom2VideoDrop, Custom3: Landing.Custom3, Custom3BtnDrop: Landing.Custom3BtnDrop,
  OnlyButtons: Landing.OnlyButtons, Button: Landing.Button, Video: Landing.Video, YouTube: Landing.YouTube, BackgroundVideo: Landing.BackgroundVideo,
  Link: Landing.Link, Form: Landing.Form, Image: Landing.Image, Carousel: Landing.Carousel, Map: Landing.Map,
  NavbarElement: Landing.NavbarElement, Heading: Landing.Heading, Columns: Landing.Columns, Spacer: Landing.Spacer,
  Divider: Landing.Divider, List: Landing.List, Quote: Landing.Quote, Icon: Landing.Icon, Badge: Landing.Badge,
  Accordion: Landing.Accordion, Pricing: Landing.Pricing, Testimonial: Landing.Testimonial, Stats: Landing.Stats,
  TeamGrid: Landing.TeamGrid, Timeline: Landing.Timeline, CTABanner: Landing.CTABanner, LogoStrip: Landing.LogoStrip,
  SocialLinks: Landing.SocialLinks, Newsletter: Landing.Newsletter, Booking: Landing.Booking,
  ProductCatalog: Landing.ProductCatalog, Engagement: Landing.Engagement, Tabs: Landing.Tabs, Countdown: Landing.Countdown,
};
const BLUE = { r: 37, g: 99, b: 235, a: 1 }; const INK = { r: 15, g: 23, b: 42, a: 1 };
const MUTED = { r: 71, g: 85, b: 105, a: 1 }; const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const PALE = { r: 239, g: 246, b: 255, a: 1 }; const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 };

function DefaultProjectCanvas() {
  return <Element canvas is={Landing.Container} width="800px" height="auto" background={WHITE} padding={['0', '0', '0', '0']} custom={{ displayName: 'App' }}>
    <Landing.NavbarElement animation="none" brand="Northstar Studio" sticky links={[{ text: 'Home', href: '#home' }, { text: 'Services', href: '#services' }, { text: 'Pricing', href: '#pricing' }, { text: 'Contact', href: '#contact' }]} />
    {/*
      * The starter page opens on footage rather than a coloured box.
      *
      * This is the first thing anybody sees of the editor, and a background
      * video is the strongest thing it can do — showing it here is how people
      * find out the element exists at all. The poster carries the hero on a
      * phone, for anyone who asked for less motion, and if the clip fails.
      */}
    <Element canvas is={Landing.Video} anchor="home" sourceType="background" src={clipFor('studio').url} poster="https://picsum.photos/seed/studio-desk-at-work/1600/900" overlay={58} position="center" minHeight="520px" loop videoId="" videoUrl="" text="" custom={{ displayName: 'Hero video' }}>
      <Element canvas is={Landing.Container} width="100%" background={TRANSPARENT} color={WHITE} padding={['72', '48', '64', '48']} custom={{ displayName: 'Hero' }}>
        <Landing.Badge animation="pop" text="A complete modern starter site" background={BLUE} color={WHITE} />
        <Landing.Heading animation="fadeUp" animationDelay={90} level="1" text="Turn a good idea into a site that works" fontSize="52" fontWeight="800" color={WHITE} margin={['18', '0', '16', '0']} />
        <Landing.Text animation="fadeUp" animationDelay={180} text="Edit every block, publish multiple pages, accept bookings and payments, and learn what visitors do next." fontSize="19" color={{ r: 203, g: 213, b: 225, a: 1 }} />
        <Landing.Button animation="fadeUp" animationDelay={270} text="Explore the sections" action="section" actionValue="services" background={BLUE} color={WHITE} margin={['24', '0', '8', '0']} />
        <Landing.Countdown animation="fade" animationDelay={360} target="2030-01-01T00:00:00Z" label="Launch offer ends in" expiredText="The launch offer has ended." accent={{ r: 96, g: 165, b: 250, a: 1 }} />
      </Element>
    </Element>
    <Element canvas is={Landing.Container} width="100%" background={WHITE} padding={['48', '48', '48', '48']} custom={{ displayName: 'Proof' }}>
      <Landing.Stats animation="zoomIn" items={['1,200+', 'sites published', '4 min', 'from idea to first draft', '24/7', 'lead capture']} accent={BLUE} color={MUTED} />
    </Element>
    <Element canvas is={Landing.Container} anchor="services" width="100%" background={PALE} padding={['56', '48', '56', '48']} custom={{ displayName: 'Services' }}>
      <Landing.Heading text="Everything your visitors need" fontSize="34" color={INK} />
      <Landing.Tabs animation="fadeLeft" items={['Build', 'Compose a responsive site from reusable sections.', 'Publish', 'Deploy pages, metadata, sitemap and a custom domain.', 'Grow', 'Collect leads, subscribers, bookings, reviews and orders.']} accent={BLUE} />
      <Landing.Divider color={{ r: 148, g: 163, b: 184, a: 0.45 }} spacing="28" />
      <Landing.ProductCatalog animation="fadeRight" products={['Starter audit', 'A focused review with an action plan', '49.00', '', 'Launch package', 'Design, build and publishing support', '199.00', '', 'Growth session', 'Analytics and conversion improvements', '89.00', '']} paymentLinks={['', '', '']} buttonText="Buy now" currency="USD" accent={BLUE} />
    </Element>
    <Element canvas is={Landing.Container} anchor="pricing" width="100%" background={WHITE} padding={['56', '48', '56', '48']} custom={{ displayName: 'Pricing' }}>
      <Landing.Heading text="Choose your starting point" fontSize="34" color={INK} />
      <Landing.Pricing animation="fadeUp" tiers={['Starter', '$19', '/month', 'Start', 'One site;Analytics;Forms', 'Studio', '$49', '/month', 'Choose Studio', 'Five sites;Bookings;Commerce', 'Agency', '$99', '/month', 'Contact us', 'Unlimited sites;Priority support;Team access']} featured={2} accent={BLUE} background={WHITE} color={INK} />
      <Landing.Accordion animation="fade" animationDelay={120} items={['Can I change the content?', 'Yes. Every element is editable in the visual canvas.', 'Can I use my own domain?', 'Yes. Connect it during publishing and SSL is provisioned automatically.', 'Are payments stored here?', 'No. Each Buy button opens the payment link supplied by the site owner.']} background={PALE} color={INK} />
    </Element>
    <Element canvas is={Landing.Container} width="100%" background={PALE} padding={['56', '48', '56', '48']} custom={{ displayName: 'Conversions' }}>
      <Landing.Heading text="Make the next step effortless" fontSize="34" color={INK} />
      <Landing.Booking animation="fadeUp" heading="Book a discovery call" buttonText="Confirm booking" duration={60} startHour={9} endHour={17} timeZone="Asia/Jerusalem" accent={BLUE} />
      <Landing.Spacer height="28" />
      <Landing.Newsletter animation="fadeUp" animationDelay={90} heading="Get one useful growth note a month" placeholder="you@example.com" buttonText="Subscribe" successMessage="Check your inbox to confirm." accent={BLUE} color={INK} />
      <Landing.Spacer height="28" />
      <Landing.Engagement animation="pop" animationDelay={180} mode="review" heading="Share your experience" options={['👍', '❤️', '👏']} accent={BLUE} />
    </Element>
    <Element canvas is={Landing.Container} anchor="contact" width="100%" background={WHITE} padding={['56', '48', '56', '48']} custom={{ displayName: 'Contact' }}>
      <Landing.Heading text="Tell us what you are building" fontSize="34" color={INK} />
      <Landing.Form animation="fadeLeft" fields={[{ label: 'Name', type: 'text', placeholder: 'Your name', required: true }, { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true }, { label: 'Brief', type: 'textarea', placeholder: 'A few useful details' }, { label: 'Attachment', type: 'file', placeholder: '' }]} submitText="Send the brief" successMessage="Thanks — we will be in touch." background={PALE} accent={BLUE} textColor={INK} inputBackground={WHITE} inputBorder={{ r: 203, g: 213, b: 225, a: 1 }} width="100%" />
      <Landing.Map animation="fadeRight" animationDelay={120} lat={32.0853} lng={34.7818} zoom={14} height="300px" width="100%" label="Northstar Studio" address="Tel Aviv, Israel" />
    </Element>
    <Element canvas is={Landing.Container} width="100%" background={INK} color={WHITE} padding={['40', '48', '40', '48']} custom={{ displayName: 'Footer' }}>
      <Landing.CTABanner animation="zoomIn" title="Ready to make it yours?" text="Select any block and start editing." cta="Back to top" href="#home" background={BLUE} color={WHITE} buttonBackground={WHITE} buttonColor={BLUE} />
      <Landing.SocialLinks items={['Instagram', 'https://instagram.com/', 'LinkedIn', 'https://linkedin.com/', 'Email', 'mailto:hello@example.com']} background={TRANSPARENT} color={WHITE} size="16" />
    </Element>
  </Element>;
}

export default function CreateNewProject() {
  return <><NavBar /><ThemeProvider theme={theme}><div className="h-full h-screen"><Editor resolver={resolver} enabled onRender={Landing.RenderNode}><LoadProjectOnMount /><Landing.Viewport><Frame>{DefaultProjectCanvas()}</Frame></Landing.Viewport></Editor></div></ThemeProvider></>;
}
