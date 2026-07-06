import BottomNav from './BottomNav.jsx'
import { useAuth } from '../state/auth.jsx'

export default function AppBottomNav() {
  const { navVariant } = useAuth()
  return <BottomNav variant={navVariant} />
}
