import { mode } from '@chakra-ui/theme-tools'
import colors from './foundations/colors'

export const globalStyles = {
  colors: {
    ...colors,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode('#F8F6FB', '#16062F')(props),
        color: mode('gray.800', 'gray.100')(props),
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
        backgroundImage: mode(
          'linear-gradient(135deg, rgba(75,17,150,0.06), transparent 42%), linear-gradient(180deg, #FAF8FC 0%, #F1ECF7 100%)',
          'linear-gradient(145deg, #16062F 0%, #210842 100%)',
        ),
      },
      html: {
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
      },
      '#root': {
        minHeight: '100vh',
      },
      '::selection': {
        background: mode('brand.200', 'brand.600')(props),
      },
    }),
  },
}
