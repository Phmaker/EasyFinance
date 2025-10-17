// src/app/components/ParticlesBackground.tsx
'use client';

import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine, Container } from "tsparticles-engine";

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // MUDANÇA: Adicionado comentário para desabilitar o aviso do ESLint na próxima linha
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const particlesLoaded = useCallback(async (_container: Container | undefined) => {
    // Ação opcional quando as partículas carregam. O underscore e o comentário indicam que não usar o parâmetro é intencional.
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          color: {
            value: "#0d1117",
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "bubble", 
            },
            resize: true,
          },
          modes: {
            bubble: {
              distance: 250,
              duration: 2,
              opacity: 0.8,
              size: 7,
            },
          },
        },
        particles: {
          color: {
            value: ["#2563eb", "#3b82f6", "#60a5fa"],
          },
          links: {
            color: "#1e40af",
            distance: 150,
            enable: true,
            opacity: 0.2,
            width: 1,
          },
          collisions: {
            enable: false,
          },
          move: {
            direction: "top",
            enable: true,
            outModes: {
              default: "out",
            },
            random: true,
            speed: 0.5,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 80,
          },
          opacity: {
            value: { min: 0.1, max: 0.5 },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticlesBackground;