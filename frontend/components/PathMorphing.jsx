"use client"

import { interpolate } from "flubber"
import {
    animate,
    motion,
    useMotionValue,
    useTransform,
} from "framer-motion"
import { useEffect, useState } from "react"

export default function PathMorphing() {
    const [pathIndex, setPathIndex] = useState(0)
    const progress = useMotionValue(pathIndex)
    const fill = useTransform(progress, paths.map(getIndex), colors)
    const path = useFlubber(progress, paths)

    useEffect(() => {
        // Start animation after a pause, but ONLY if we're not at the very beginning
        // or just use a standard interval for smoothness.
        const timeout = setTimeout(() => {
            const animation = animate(progress, pathIndex, {
                duration: 1.5,
                ease: "easeInOut",
                onComplete: () => {
                    if (pathIndex === paths.length - 1) {
                        progress.set(0)
                        setPathIndex(1)
                    } else {
                        setPathIndex(pathIndex + 1)
                    }
                },
            })
            return () => animation.stop()
        }, pathIndex === 0 ? 3000 : 2000) // Longer pause on first icon, then normal

        return () => clearTimeout(timeout)
    }, [pathIndex, progress])

    return (
        <svg width="180" height="180" viewBox="0 0 200 200" className="drop-shadow-3xl filter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <g transform="translate(40 40) scale(5 5)">
                <motion.path 
                  fill={fill} 
                  d={path} 
                  initial={false}
                />
            </g>
        </svg>
    )
}

/**
 * ==============   Utils   ================
 */

const getIndex = (_, index) => index

function useFlubber(progress, paths) {
    return useTransform(progress, paths.map(getIndex), paths, {
        mixer: (a, b) => interpolate(a, b, { maxSegmentLength: 0.1 }),
    })
}

/**
 * ==============   Shape data   ================
 */

const pen = "M15,2H9C8.4,2,8,2.4,8,3v15l4,4l4-4V3C16,2.4,15.6,2,15,2z M14,17h-4V4h4V17z"
const book = "M18,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4C20,2.9,19.1,2,18,2z M18,20H6V4h12V20z M8,7h8v2H8V7z M8,11h8v2H8V11z"
const cap = "M12,2L0,8l12,6l12-6L12,2z M2,8l10-5l10,5l-10,5L2,8z M4,10v4c0,4.4,3.6,8,8,8s8-3.6,8-8v-4h-2v4c0,3.3-2.7,6-6,6s-6-2.7-6-6v-4H4z"

const paths = [pen, book, cap, pen]
const colors = [
    "#3b82f6",
    "#a855f7",
    "#2dd4bf",
    "#3b82f6"
]
