import React from 'react';

export const ArrowUp = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <title>Arrow Up</title>
    <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"></path>
  </svg>
);

export const Delete = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <style>
        {`
          .a {
            fill: #707070;
          }
        `}
      </style>
    </defs>
    <title>S Delete 18 N</title>
    <rect id="Canvas" fill="#ff13dc" opacity="0" />
    <path
      className="a"
      d="M15.75,3H12V2a1,1,0,0,0-1-1H6A1,1,0,0,0,5,2V3H1.25A.25.25,0,0,0,1,3.25v.5A.25.25,0,0,0,1.25,4h1L3.4565,16.55a.5.5,0,0,0,.5.45H13.046a.5.5,0,0,0,.5-.45L14.75,4h1A.25.25,0,0,0,16,3.75v-.5A.25.25,0,0,0,15.75,3ZM5.5325,14.5a.5.5,0,0,1-.53245-.46529L5,14.034l-.5355-8a.50112.50112,0,0,1,1-.067l.5355,8a.5.5,0,0,1-.46486.53283ZM9,14a.5.5,0,0,1-1,0V6A.5.5,0,0,1,9,6ZM11,3H6V2h5Zm1,11.034a.50112.50112,0,0,1-1-.067l.5355-8a.50112.50112,0,1,1,1,.067Z"
    />
  </svg>
);

export const Move = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <style>
        {`
          .a {
            fill: #707070;
          }
        `}
      </style>
    </defs>
    <title>S Move 18 N</title>
    <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
    <path
      className="a"
      d="M17,9a.25.25,0,0,0-.0565-.158L16,8.0145V8h-.0165L14.927,7.0735A.245.245,0,0,0,14.75,7a.25.25,0,0,0-.25.25V8H10V3.5h.75A.25.25,0,0,0,11,3.25a.24448.24448,0,0,0-.0735-.175L10,2.0165V2H9.9855L9.158,1.0565a.25.25,0,0,0-.316,0L8.0145,2H2v.0165l-.9435.8275a.25.25,0,0,0,0,.316L2,9.9855V10h.0165l1.0565.926A.24552.24552,0,0,0,3.25,11a.25.25,0,0,0,.25-.25V10H8v4.5H7.25a.25.25,0,0,0-.25.25.24352.24352,0,0,0,.0735.175L8,15.9835V16h.0145l.8275.9435a.25.25,0,0,0,.316,0L9.9855,16H10v-.0165l.9265-1.057A.24349.24349,0,0,0,11,14.75a.25.25,0,0,0-.25-.25H10V10h4.5v.75a.25.25,0,0,0,.25.25.24549.24549,0,0,0,.175-.074L15.9835,10H16V9.9855l.9435-.8275A.25.25,0,0,0,17,9Z"
    />
  </svg>
);

export const Undo = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" {...props}>
    <defs>
      <style>
        {`
          .a {
            fill: #707070;
          }
        `}
      </style>
    </defs>
    <title>Undo</title>
    <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
    <path className="a" d="M15.3315,6.271A5.19551,5.19551,0,0,0,11.8355,5H5.5V2.4A.4.4,0,0,0,5.1,2a.39352.39352,0,0,0-.2635.1L1.072,5.8245a.25.25,0,0,0,0,.35L4.834,9.9a.39352.39352,0,0,0,.2635.1.4.4,0,0,0,.4-.4V7h6.441A3.06949,3.06949,0,0,1,15.05,9.9a2.9445,2.9445,0,0,1-2.78274,3.09783Q12.13375,13.005,12,13H8.5a.5.5,0,0,0-.5.5v1a.5.5,0,0,0,.5.5h3.263a5.16751,5.16751,0,0,0,5.213-4.5065A4.97351,4.97351,0,0,0,15.3315,6.271Z" />
  </svg>
);

export const Redo = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" {...props}>
    <defs>
      <style>
        {`
          .a {
            fill: #707070;
          }
        `}
      </style>
    </defs>
    <title>Redo</title>
    <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
    <path className="a" d="M2.6685,6.271A5.19551,5.19551,0,0,1,6.1645,5H12.5V2.4a.4.4,0,0,1,.4-.4.39352.39352,0,0,1,.2635.1l3.762,3.7225a.25.25,0,0,1,0,.35L13.166,9.9a.39352.39352,0,0,1-.2635.1.4.4,0,0,1-.4-.4V7H6.0615A3.06949,3.06949,0,0,0,2.95,9.9a2.9445,2.9445,0,0,0,2.78274,3.09783Q5.86626,13.005,6,13H9.5a.5.5,0,0,1,.5.5v1a.5.5,0,0,1-.5.5H6.237a5.16751,5.16751,0,0,1-5.213-4.5065A4.97349,4.97351,0,0,1,2.6685,6.271Z" />
  </svg>
);

export const Checkmark = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <title>S Checkmark 18 N</title>
    <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
    <path
      className="a"
      d="M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z"
    />
  </svg>
);

export const Customize = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <title>S Edit 18 N</title>
    <rect id="Canvas" fill="#ff13dc" opacity="0" />
    <path
      className="a"
      d="M16.7835,4.1,13.9,1.216a.60751.60751,0,0,0-.433-.1765H13.45a.6855.6855,0,0,0-.4635.203L2.542,11.686a.49494.49494,0,0,0-.1255.211L1.0275,16.55c-.057.1885.2295.4255.3915.4255a.12544.12544,0,0,0,.031-.0035c.138-.0315,3.933-1.172,4.6555-1.389a.486.486,0,0,0,.207-.1245L16.7565,5.014a.686.686,0,0,0,.2-.4415A.61049.61049,0,0,0,16.7835,4.1ZM5.7,14.658c-1.0805.3245-2.431.7325-3.3645,1.011L3.34,12.304Z"
    />
  </svg>
);

export const ContainerToolbox = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <title>S Rectangle 18 N</title>
    <rect id="Canvas" opacity="0" />
    <path d="M1,2.5v13a.5.5,0,0,0,.5.5h15a.5.5,0,0,0,.5-.5V2.5a.5.5,0,0,0-.5-.5H1.5A.5.5,0,0,0,1,2.5ZM16,15H2V3H16Z" />
  </svg>
);

export const TextToolbox = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M5 5v14h14V5H5zM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm9 7v7h-2v-7H7V8h10v2h-4z" />
  </svg>
);

export const ButtonToolbox = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <title>S Button 18 N</title>
    <rect id="Canvas" opacity="0" />
    <path d="M13,4H5A5,5,0,0,0,5,14h8A5,5,0,0,0,13,4Zm0,9.05H5a4.05,4.05,0,0,1,0-8.1h8a4.05,4.05,0,0,1,0,8.1Z" />
    <path d="M13,6.05H5a2.95,2.95,0,0,0,0,5.9h8a2.95,2.95,0,0,0,0-5.9Z" />
  </svg>
);

export const VideoToolbox = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 3.993C3 3.445 3.445 3 3.993 3h16.014c.548 0 .993.445.993.993v16.014a.994.994 0 0 1-.993.993H3.993A.994.994 0 0 1 3 20.007V3.993zM5 5v14h14V5H5zm5.622 3.415l4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332z" />
  </svg>
);

export const Layers = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <title>S Layers 18 N </title>
    <rect id="Canvas" opacity="0" />
    <path
      className="a"
      d="M14.144,9.969,9.2245,13.3825a.3945.3945,0,0,1-.45,0L3.856,9.969.929,12a.1255.1255,0,0,0,0,.2055l7.925,5.5a.2575.2575,0,0,0,.292,0l7.925-5.5a.1255.1255,0,0,0,0-.2055Z"
    />
    <path
      className="a"
      d="M8.85,11.494.929,6a.1245.1245,0,0,1,0-.205L8.85.297a.265.265,0,0,1,.3,0l7.921,5.496a.1245.1245,0,0,1,0,.205L9.15,11.494A.265.265,0,0,1,8.85,11.494Z"
    />
  </svg>
);
  export const LinkToolbox = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" {...props}>
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M14 13.5V8a4 4 0 1 0-8 0v5.5a6.5 6.5 0 1 0 13 0V4h2v9.5a8.5 8.5 0 1 1-17 0V8a6 6 0 1 1 12 0v5.5a3.5 3.5 0
   0 1-7 0V8h2v5.5a1.5 1.5 0 0 0 3 0z" />
    </svg>
  );
