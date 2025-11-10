'use client'

import { Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="text-white text-lg font-medium animate-pulse">
            Loading 3D Scene...
          </div>
        </div>
      }
    >
      <div className={`w-full h-full ${className}`}>
        <Spline
          scene={scene}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent'
          }}
        />
      </div>
    </Suspense>
  )
}
