import React, { useLayoutEffect } from "react";

const CustomTextArea = ({
  request,
  setRequest,
  handleSendByKeyPress,
  finalMsgSent,
  isMobile,
  inputRef,
}: {
  request: string;
  setRequest: (val: string) => void;
  handleSendByKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  finalMsgSent: boolean;
  isMobile: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) => {

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || 20;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0;
    const maxRows = isMobile ? 7 : 10;
    const maxH = lh * maxRows + pad;

    if (!request) {
      // force 1-line height when empty
      el.style.height = `${lh + pad}px`;
      el.style.overflowY = "hidden";
      return;
    }

    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, [request, isMobile]);

  return (
    <textarea
      id="custom-text-area"
      rows={1}
      ref={inputRef}
      disabled={finalMsgSent}
      value={request}
      onChange={(e) => setRequest(e.target.value)}
      onKeyDown={handleSendByKeyPress}
      placeholder="Posez votre question"
      style={{
        width: "100%",
        resize: "none",
        fontFamily: '"Peugeot New", sans-serif',
        padding: "0",
        height: "100%",
        lineHeight: "20px",
        fontSize: "16px",
        overflowY: "hidden",
        border: "none",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
};

export default CustomTextArea;
