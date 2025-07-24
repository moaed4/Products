import { Link } from 'react-router-dom'
import { Button, Container, Box, Typography } from '@mui/material'
import { LockOpen, Dashboard } from '@mui/icons-material'

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Product Dashboard
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Manage your products with ease
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button
          component={Link}
          to="/dashboard"
          variant="contained"
          size="large"
          startIcon={<Dashboard />}
          sx={{ px: 4 }}
        >
          Go to Dashboard
        </Button>
        
        <Button
          component={Link}
          to="/sign-in"
          variant="outlined"
          size="large"
          startIcon={<LockOpen />}
          sx={{ px: 4 }}
        >
          Sign In
        </Button>
      </Box>
    </Container>
  )
}