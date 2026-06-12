import React from 'react';

export default {
  search: ({ width = '18px', height = '18px', fillColor = 'none' } = {}) => {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 20 20"
        fill={fillColor}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_478_2199)">
          <circle
            cx="7.27112"
            cy="7.87728"
            r="6.60047"
            transform="rotate(38.275 7.27112 7.87728)"
            stroke="white"
          />
          <path
            d="M17.8994 17.329C18.1162 17.5001 18.4306 17.463 18.6016 17.2462C18.7727 17.0294 18.7356 16.715 18.5188 16.544L17.8994 17.329ZM12.5613 12.4801L12.2516 12.8726L17.8994 17.329L18.2091 16.9365L18.5188 16.544L12.871 12.0876L12.5613 12.4801Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_478_2199">
            <rect width="20" height="20" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  },
};
