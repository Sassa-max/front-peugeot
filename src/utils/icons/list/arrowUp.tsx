import React from 'react';

export default {
  arrowUp: ({ width = '16px', height = '18px', fillColor = 'none' } = {}) => {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 16 18"
        fill={fillColor}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.46997 0.25C10.9874 3.36321 13.3372 6.60835 15.5094 9.97161L14.5898 10.6558C12.6465 7.6069 11.0153 5.26955 8.5685 2.06733V17.75H7.44088V2.01259C4.99953 5.22029 3.36831 7.55763 1.41961 10.6066L0.5 9.97161C2.67387 6.60684 5.0274 3.3616 7.55036 0.25H8.46997Z"
          fill="white"
        />
      </svg>
    );
  },
};
