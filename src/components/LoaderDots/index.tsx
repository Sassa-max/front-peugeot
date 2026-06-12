import React from "react";
import { Box } from "@mui/material";
import { TypoProps } from "../../types/chatBot";
import { motion } from "framer-motion";

const dotVariants = {
  animate: {
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop" as "loop",
    },
  },
};

type LoaderDotsProps = {
  TypoComp: React.ComponentType<TypoProps>;
};

const LoaderDots = ({ TypoComp }: LoaderDotsProps) => (
  <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
    {/* <TypoComp variant="caption" color="text.secondary" sx={{ height: 30 }}>
      Assistant LAION est en train d'écrire
    </TypoComp> */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: "#9ca3af",
          display: "inline-block",
          alignSelf: "baseline",
        }}
        variants={dotVariants}
        animate="animate"
        transition={{
          delay: 0.3,
          duration: 1.5,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    ))}
  </Box>
);

export default LoaderDots;