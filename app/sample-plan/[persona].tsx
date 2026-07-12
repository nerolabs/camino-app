import { useLocalSearchParams } from 'expo-router';
import SamplePlanScreen from '@/components/SamplePlanScreen';
import { EXTRA_PERSONAS } from '@/core/sample-personas';

// /sample-plan/<persona> — the SEO-expansion personas (eu-family, digital-nomad,
// property-owners). Statically exported per persona; an unknown slug falls back to the
// default persona inside the screen.
export function generateStaticParams(): Record<string, string>[] {
  return EXTRA_PERSONAS.map(p => ({ persona: p.id }));
}

export default function SamplePersonaPage() {
  const { persona } = useLocalSearchParams<{ persona: string }>();
  return <SamplePlanScreen personaId={typeof persona === 'string' ? persona : undefined} />;
}
