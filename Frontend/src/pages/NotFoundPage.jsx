import { Button, Container, Box, Typography } from '@mui/material'
import { Home, ArrowBack } from '@mui/icons-material'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The page you are looking for doesn't exist or has been moved.
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<Home />}
          sx={{ px: 4 }}
        >
          Go Home
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          sx={{ px: 4 }}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </Box>
    </Container>
  )
}