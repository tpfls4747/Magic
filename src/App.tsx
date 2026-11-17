import { AtelierCanvas } from '@/scenes/AtelierCanvas'
import { ExhibitHoverLabel } from '@/sections/ExhibitHoverLabel'
import { HeroOverlay } from '@/sections/HeroOverlay'
import { ScrollTour } from '@/sections/ScrollTour'

function App() {
  return (
    <main>
      <AtelierCanvas />
      <HeroOverlay />
      <ScrollTour />
      <ExhibitHoverLabel />
    </main>
  )
}

export default App
