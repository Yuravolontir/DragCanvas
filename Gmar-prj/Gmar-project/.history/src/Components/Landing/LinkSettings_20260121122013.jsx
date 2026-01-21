import React from 'react';

import { ToolbarSection, ToolbarItem } from './Toolbar';

export const LinkSettings = () => {
  return (
    <React.Fragment>
      <ToolbarSection title="Link">
        <ToolbarItem
          full={true}
          propKey="href"
          type="text"
          label="URL"
        />
      </ToolbarSection>
    </React.Fragment>
  );
};
