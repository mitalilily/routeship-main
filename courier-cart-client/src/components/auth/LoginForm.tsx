import { Box, Link, Stack, Typography } from '@mui/material'
import { FiArrowUpRight, FiCheckCircle } from 'react-icons/fi'
import PhoneForm from './PhoneForm'

const LANDING_PAGE_URL = 'https://reliable-dusk-717444.netlify.app/'

const highlights = [
  'Compare courier options in one workspace',
  'Book, track, and resolve shipment exceptions',
  'Keep billing and COD movement visible',
]

export default function LoginForm() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(360px, 0.9fr) minmax(520px, 1.1fr)' },
        backgroundColor: '#FCFAFE',
      }}
    >
      <Box
        component="section"
        sx={{
          minHeight: { xs: 230, lg: '100vh' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 3, sm: 5, lg: 7 },
          color: '#FFFFFF',
          background:
            'linear-gradient(150deg, #16062F 0%, #2B0A55 58%, #4B1196 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />

        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component="img"
            src="/brand/routeship-logo.png"
            alt="RouteShip"
            sx={{ width: { xs: 172, sm: 210 }, height: 'auto', objectFit: 'contain' }}
          />
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
            Merchant shipping workspace
          </Typography>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: { xs: 'none', lg: 'block' },
            maxWidth: 520,
          }}
        >
          <Typography
            component="h1"
            sx={{ fontSize: 'clamp(2.4rem, 4.8vw, 4.8rem)', lineHeight: 1.02, fontWeight: 800 }}
          >
            Shipping, without the guesswork.
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 460, color: 'rgba(255,255,255,0.74)', lineHeight: 1.75 }}>
            One focused command center for orders, courier choices, delivery updates, and daily
            exceptions.
          </Typography>
          <Stack spacing={1.6} sx={{ mt: 4 }}>
            {highlights.map((item) => (
              <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                <FiCheckCircle size={18} color="#FF7A1A" />
                <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontWeight: 650 }}>
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Link
          href={LANDING_PAGE_URL}
          target="_blank"
          rel="noreferrer"
          underline="none"
          sx={{
            position: 'relative',
            zIndex: 1,
            display: { xs: 'none', lg: 'inline-flex' },
            alignItems: 'center',
            gap: 1,
            color: '#FFFFFF',
            fontWeight: 800,
            width: 'fit-content',
          }}
        >
          Visit RouteShip <FiArrowUpRight size={17} />
        </Link>
      </Box>

      <Box
        component="main"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 5, xl: 9 },
          py: { xs: 4, sm: 6 },
          minHeight: { lg: '100vh' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <Typography
            sx={{
              color: '#E85500',
              fontSize: '0.76rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              mb: 1.2,
            }}
          >
            Secure merchant access
          </Typography>
          <Typography component="h2" sx={{ color: '#16062F', fontSize: { xs: '2rem', sm: '2.5rem' }, fontWeight: 800 }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: '#746A80', lineHeight: 1.7, mt: 1, mb: 4 }}>
            Sign in to manage shipments across India.
          </Typography>

          <PhoneForm />

          <Typography sx={{ color: '#8A8194', fontSize: '0.78rem', textAlign: 'center', mt: 3 }}>
            Protected merchant access for your RouteShip workspace
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
