// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SignIn,
  useUser,
  ClerkLoading,
  ClerkLoaded,
  useClerk
} from '@clerk/clerk-react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  CssBaseline,
  Paper,
  Container,
  Button,
  useTheme,
  ThemeProvider,
  createTheme
} from '@mui/material'; // Custom themes (see below)

export default function LoginPage() {
  const { isSignedIn } = useUser();
  const { appearance } = useClerk();
  const theme = useTheme();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Custom social login buttons
  const socialButtons = {
    google: { label: 'Continue with Google' },
    github: { label: 'Continue with GitHub' },
    facebook: { label: 'Continue with Facebook' }
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography component="h1" variant="h5">
                {showReset ? 'Reset Password' : 'Sign In'}
              </Typography>
              <Button 
                size="small" 
                onClick={toggleDarkMode}
                sx={{ textTransform: 'none' }}
              >
                {darkMode ? '☀️ Light' : '🌙 Dark'} Mode
              </Button>
            </Box>

            <SignedOut>
              <ClerkLoading>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              </ClerkLoading>
              <ClerkLoaded>
                {showReset ? (
                  <SignIn
                    path="/reset-password"
                    routing="path"
                    appearance={{
                      ...appearance,
                      variables: {
                        colorPrimary: theme.palette.primary.main,
                      },
                      elements: {
                        card: {
                          boxShadow: 'none',
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                        },
                        socialButtonsBlockButtonText: {
                          fontWeight: 600,
                        },
                      }
                    }}
                    afterResetPasswordUrl="/login"
                  />
                ) : (
                  <SignIn 
                    appearance={{
                      ...appearance,
                      variables: {
                        colorPrimary: theme.palette.primary.main,
                        colorText: theme.palette.text.primary,
                        colorBackground: theme.palette.background.paper,
                      },
                      elements: {
                        rootBox: { width: '100%' },
                        card: { 
                          width: '100%',
                          boxShadow: 'none',
                          padding: 0,
                          margin: 0,
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          backgroundColor: theme.palette.background.paper,
                        },
                        formFieldInput: {
                          backgroundColor: theme.palette.background.default,
                          borderColor: theme.palette.divider,
                        },
                        socialButtonsBlockButton: {
                          borderColor: theme.palette.divider,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          }
                        },
                        socialButtonsBlockButtonText: {
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                        },
                      },
                      layout: {
                        socialButtonsPlacement: 'bottom',
                        socialButtonsVariant: 'blockButton',
                      },
                      socialButtonVariant: 'blockButton',
                      socialButton: socialButtons,
                    }}
                    afterSignInUrl="/"
                    afterSignUpUrl="/"
                  />
                )}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button 
                    size="small" 
                    onClick={() => setShowReset(!showReset)}
                    sx={{ textTransform: 'none' }}
                  >
                    {showReset ? 'Back to Sign In' : 'Forgot Password?'}
                  </Button>
                </Box>
              </ClerkLoaded>
            </SignedOut>

            <SignedIn>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>You're already signed in!</Typography>
                <Typography>
                  Redirecting you to the home page...
                </Typography>
                <CircularProgress sx={{ mt: 2 }} />
              </Box>
            </SignedIn>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

// Create these theme files in src/themes/index.js
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});