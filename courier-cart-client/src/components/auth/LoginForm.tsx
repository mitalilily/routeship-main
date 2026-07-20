import { Box, Link, Stack, Typography } from '@mui/material'
import { FiArrowUpRight } from 'react-icons/fi'
import PhoneForm from './PhoneForm'

const LANDING_PAGE_URL = 'https://reliable-dusk-717444.netlify.app/'

export default function LoginForm() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '55% 45%' },
        backgroundColor: '#FFFAF2',
      }}
    >
      <Box
        component="section"
        sx={{
          minHeight: '100vh',
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          p: { lg: 6, xl: 8 },
          color: '#07132D',
          backgroundColor: '#FFFAF2',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid #EEE5D8',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/brand/routeship-network-auth.png')",
            backgroundPosition: 'center center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <Stack
          sx={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          <Box
            component="img"
            src="/brand/admin-logo-colored.svg"
            alt="RouteShip"
            sx={{ width: { lg: 240, xl: 280 }, height: 'auto', objectFit: 'contain' }}
          />

          <Box sx={{ maxWidth: 520, mb: { lg: 12, xl: 16 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
              <Box sx={{ width: 36, height: 2, backgroundColor: '#FF4B0A' }} />
              <Typography
                sx={{
                  color: '#0B3DBB',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Console Login
              </Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                color: '#07132D',
                fontSize: { lg: '3.4rem', xl: '4.6rem' },
                lineHeight: 1.04,
                fontWeight: 850,
                letterSpacing: 0,
              }}
            >
              Every shipment.
              <Box component="span" sx={{ display: 'block', color: '#FF4B0A' }}>
                In clear view.
              </Box>
            </Typography>
          </Box>

          <Link
            href={LANDING_PAGE_URL}
            target="_blank"
            rel="noreferrer"
            underline="none"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              color: '#07132D',
              fontWeight: 850,
              width: 'fit-content',
            }}
          >
            Visit RouteShip <FiArrowUpRight size={17} />
          </Link>
        </Stack>
      </Box>

      <Box
        component="main"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
          minHeight: '100vh',
          px: { xs: 3, sm: 6, lg: 7, xl: 8 },
          py: { xs: 4, sm: 6 },
          backgroundColor: '#FFFDF8',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 430, minWidth: 0 }}>
          <Box
            component="img"
            src="/brand/admin-logo-colored.svg"
            alt="RouteShip"
            sx={{
              display: { xs: 'block', lg: 'none' },
              width: { xs: 210, sm: 230 },
              height: 'auto',
              objectFit: 'contain',
              mb: 5,
            }}
          />
          <Typography
            sx={{
              color: '#0B3DBB',
              fontSize: '0.76rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              mb: 1.2,
            }}
          >
            Console Login
          </Typography>
          <Typography
            component="h2"
            sx={{
              color: '#07132D',
              fontSize: { xs: '2rem', sm: '2.5rem' },
              fontWeight: 850,
              letterSpacing: 0,
            }}
          >
            Welcome back
          </Typography>
          <Typography sx={{ color: '#65708A', lineHeight: 1.7, mt: 1.2, mb: 4, fontSize: '0.95rem' }}>
            Sign in to book, track, reconcile, and manage your RouteShip console.
          </Typography>

          <PhoneForm />

          <Typography sx={{ color: '#65708A', fontSize: '0.78rem', textAlign: 'center', mt: 3 }}>
            Protected access for your RouteShip console
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
