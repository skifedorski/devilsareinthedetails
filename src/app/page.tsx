import Experience from '@/components/Experience';
import Overlay from '@/components/Overlay';

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-[#050505] overflow-hidden">
      {/* 3D Scene */}
      <Experience />
      
      {/* UI Overlay (Text, Forms, Transitions) */}
      <Overlay />
    </main>
  );
}