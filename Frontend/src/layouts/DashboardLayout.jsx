import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, CssBaseline } from '@mui/material'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Topbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: 'margin 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
          marginLeft: sidebarOpen ? '240px' : '0px'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}