import React from 'react';
import styled from 'styled-components';

/**
 * What this element is, in the words of somebody who has never built a website.
 *
 * The panels below it are a list of properties, and a property list only helps
 * a person who already knows what the element does. This sits at the top of
 * each Properties panel and answers the question the list assumes: what is
 * this, and what do I type in it.
 *
 * Kept to a sentence or two plus optional examples. A help box longer than the
 * controls it explains is a help box nobody reads.
 */

const Box = styled.div`
  margin: 10px 14px 4px;
  padding: 11px 12px;
  border: 1px solid var(--outline-light, #dce2ec);
  border-left: 3px solid var(--primary, #0060ac);
  border-radius: 10px;
  background: var(--surface, #fff);
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--primary, #0060ac);
  .material-symbols-outlined {
    font-size: 15px;
  }
`;

const Body = styled.p`
  margin: 5px 0 0;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--on-surface-variant, #3f4a5f);
`;

const Examples = styled.ul`
  margin: 7px 0 0;
  padding-left: 15px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted, #68748a);
  li {
    word-break: break-word;
  }
  code {
    font-size: 10.5px;
    background: var(--surface-container, #eef1f7);
    border-radius: 4px;
    padding: 0 4px;
  }
`;

export const ToolbarHelp = ({ title, icon = 'help', children, examples }) => (
  <Box>
    <Head>
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      {title}
    </Head>
    <Body>{children}</Body>
    {examples?.length ? (
      <Examples>
        {examples.map((example) => (
          <li key={example}>
            <code>{example}</code>
          </li>
        ))}
      </Examples>
    ) : null}
  </Box>
);

export default ToolbarHelp;
