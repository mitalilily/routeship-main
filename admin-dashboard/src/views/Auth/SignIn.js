import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { loginAdmin } from '../../services/auth.service'
import { useAuthStore } from '../../store/useAuthStore'

const isTokenValid = (token) => {
  try {
    return jwtDecode(token).exp > Date.now() / 1000
  } catch {
    return false
  }
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const history = useHistory()
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    if (accessToken && refreshToken && isTokenValid(refreshToken)) history.replace('/admin/dashboard')
  }, [history])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const data = await loginAdmin(email.trim().toLowerCase(), password)
      login(data.token, data?.user?.id, data.refreshToken)
      history.push('/admin/dashboard')
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.error || 'Unable to connect to RouteShip Admin',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid minH="100vh" templateColumns={{ base: '1fr', lg: '46% 54%' }} bg="#FFFFFF">
      <GridItem display={{ base: 'none', lg: 'block' }} bg="#16062F" borderRight="6px solid" borderColor="accent.400">
        <VStack h="100%" align="stretch" p={12}>
          <Box
            as="img"
            src="/brand/routeship-logo.png"
            alt="RouteShip"
            w="300px"
            h="132px"
            objectFit="contain"
            objectPosition="left center"
          />
          <VStack align="start" spacing={4} mt="80px">
            <Heading color="white" fontSize="4xl" letterSpacing="0">Route to trust.</Heading>
            <Text color="whiteAlpha.700" maxW="420px" lineHeight="1.8">
              Secure operations access for the RouteShip team.
            </Text>
          </VStack>
          <Box mt="auto" w="96px" h="6px" bg="accent.400" />
        </VStack>
      </GridItem>

      <GridItem>
        <Flex minH="100vh" align="center" justify="center" px={{ base: 6, md: 12 }} py={10}>
          <Box as="form" onSubmit={handleSubmit} w="100%" maxW="430px">
            <VStack align="stretch" spacing={6}>
              <Box
                as="img"
                display={{ base: 'block', lg: 'none' }}
                src="/brand/routeship-logo.png"
                alt="RouteShip"
                w="230px"
                h="104px"
                objectFit="contain"
                objectPosition="left center"
              />
              <Box>
                <Text color="brand.500" fontSize="xs" fontWeight="800" textTransform="uppercase">Admin Console</Text>
                <Heading mt={2} color="#210842" fontSize={{ base: '2xl', md: '3xl' }} letterSpacing="0">Welcome back</Heading>
                <Text mt={2} color="#746A80" fontSize="sm">Sign in with your RouteShip administrator account.</Text>
              </Box>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@routeship.com"
                  h="50px"
                  borderRadius="6px"
                  bg="#FBFAFC"
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(75,17,150,0.1)' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    h="50px"
                    pr="48px"
                    borderRadius="6px"
                    bg="#FBFAFC"
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(75,17,150,0.1)' }}
                  />
                  <InputRightElement h="50px" pr={2}>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword((current) => !current)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button type="submit" h="50px" color="white" bg="accent.400" borderRadius="6px" isLoading={loading} loadingText="Signing in" _hover={{ bg: 'accent.500' }}>
                Sign In
              </Button>
            </VStack>
          </Box>
        </Flex>
      </GridItem>
    </Grid>
  )
}

export default SignIn
