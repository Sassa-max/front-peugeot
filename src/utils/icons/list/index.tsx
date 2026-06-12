import React from 'react';
import cart from "./cart";
import heart from "./heart";
import search from "./search";
import arrowUp from "./arrowUp";
import mic from "./mic";
import openInNew from "./openInNew";
import assistantRRG from "./assistantRRG";
import assistantLAIon from "./assistantLAIon";

export default {
  ...cart,
  ...heart,
  ...search,
  ...arrowUp,
  ...mic,
  ...openInNew,
  ...assistantRRG,
  ...assistantLAIon,
  default: () => {
    return (
      <svg
        width="13"
        height="14"
        viewBox="0 0 13 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      />
    );
  }
};
