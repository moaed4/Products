import { Card, CardContent, Typography } from '@mui/material'
import { useUser } from '@clerk/clerk-react'

export default function DataCard({ item }) {
  const { user } = useUser()
  const isAdmin = user?.publicMetadata?.role === 'admin'

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {item.name}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          ${item.price.toFixed(2)}
        </Typography>
        <Typography variant="body2">
          {item.description}
        </Typography>
        {isAdmin && (
          <Box sx={{ mt: 2 }}>
            {/* Admin actions would go here */}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}