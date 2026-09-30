import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Vanta from 'vanta/dist/vanta.halo.min';

const HALO = Vanta.default || Vanta;

export default function VantaBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    let effect = null;

    if (containerRef.current) {
      effect = HALO({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        baseColor: 0x7c3aed,
        color2: 0x3b82f6,
        backgroundColor: 0x070513,
      });
    }

    return () => {
      if (effect) effect.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0"
      style={{ mixBlendMode: 'screen', opacity: 0.55 }}
    />
  );
}
