import { useNode } from '@craftjs/core';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  GridLegacy,
} from '@mui/material';
import React from 'react';

export const ToolbarSection = ({ title, props, summary, children }) => {
  const { nodeProps } = useNode((node) => ({
    nodeProps:
      props &&
      props.reduce((res, key) => {
        res[key] = node.data.props[key] || null;
        return res;
      }, {}),
  }));
  return (
    <Accordion
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        '&:before': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
        '&.Mui-expanded': {
          margin: '0 0',
          minHeight: '40px',
          '&:before': {
            opacity: '1',
          },
          '& + .MuiExpansionPanel-root:before ': {
            display: 'block',
          },
        },
      }}
    >
      <AccordionSummary
        sx={{
          minHeight: '36px',
          padding: 0,
          outline: 'none!important',
        }}
      >
        <div className="px-6 w-full">
          <GridLegacy container direction="row" alignItems="center" spacing={3}>
            <GridLegacy item xs={4}>
              <h5 className="text-sm text-light-gray-1 text-left font-medium text-dark-gray">
                {title}
              </h5>
            </GridLegacy>
            {summary && props ? (
              <GridLegacy item xs={8}>
                <h5 className="text-light-gray-2 text-sm text-right text-dark-blue">
                  {summary(
                    props.reduce((acc, key) => {
                      acc[key] = nodeProps[key];
                      return acc;
                    }, {})
                  )}
                </h5>
              </GridLegacy>
            ) : null}
          </GridLegacy>
        </div>
      </AccordionSummary>
      <AccordionDetails style={{ padding: '0px 24px 20px' }}>
        <GridLegacy container spacing={1}>
          {children}
        </GridLegacy>
      </AccordionDetails>
    </Accordion>
  );
};
