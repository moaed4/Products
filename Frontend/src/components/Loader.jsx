// src/components/Loader.jsx
import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const Loader = ({ text = "Loading..." }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      height="300px"
    >
      <CircularProgress color="primary" />
      <Typography mt={2}>{text}</Typography>
    </Box>
  );
};

export default Loader;
