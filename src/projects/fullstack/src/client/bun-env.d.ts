/**
 * Allows for importing assets to get their path as a string.
 */

////////////
// IMAGES //
////////////

// Allows TypeScript to understand importing the file type as a module
declare module '*.svg' {
  const path: `${string}.svg` // The path of the import
  export = path // This "module" default exports a string path
}

declare module '*.jpg' {
  const path: `${string}.jpg`
  export = path
}

declare module '*.png' {
  const path: `${string}.png`
  export = path
}

declare module '*.gif' {
  const path: `${string}.gif`
  export = path
}

declare module '*.webp' {
  const path: `${string}.webp`
  export = path
}

declare module '*.ico' {
  const path: `${string}.ico`
  export = path
}

declare module '*.bmp' {
  const path: `${string}.bmp`
  export = path
}

declare module '*.tiff' {
  const path: `${string}.tiff`
  export = path
}

declare module '*.tif' {
  const path: `${string}.tif`
  export = path
}

///////////
// AUDIO //
///////////

declare module '*.mp3' {
  const path: `${string}.mp3`
  export = path
}

declare module '*.wav' {
  const path: `${string}.wav`
  export = path
}

declare module '*.ogg' {
  const path: `${string}.ogg`
  export = path
}

declare module '*.oga' {
  const path: `${string}.oga`
  export = path
}

declare module '*.aac' {
  const path: `${string}.aac`
  export = path
}

declare module '*.flac' {
  const path: `${string}.flac`
  export = path
}

///////////
// VIDEO //
///////////

declare module '*.webm' {
  const path: `${string}.webm`
  export = path
}

declare module '*.mp4' {
  const path: `${string}.mp4`
  export = path
}

declare module '*.m4v' {
  const path: `${string}.m4v`
  export = path
}

declare module '*.ogv' {
  const path: `${string}.ogv`
  export = path
}

declare module '*.mov' {
  const path: `${string}.mov`
  export = path
}

declare module '*.avi' {
  const path: `${string}.avi`
  export = path
}
