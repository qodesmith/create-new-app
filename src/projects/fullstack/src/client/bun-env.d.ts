/**
 * Allows for importing assets in client code to get their path as a string.
 */

// CSS (side-effect import only)
declare module '*.css'

// Images
declare module '*.svg' {
  const path: string
  export = path
}
declare module '*.jpg' {
  const path: string
  export = path
}
declare module '*.png' {
  const path: string
  export = path
}
declare module '*.gif' {
  const path: string
  export = path
}
declare module '*.webp' {
  const path: string
  export = path
}
declare module '*.ico' {
  const path: string
  export = path
}
declare module '*.bmp' {
  const path: string
  export = path
}
declare module '*.tiff' {
  const path: string
  export = path
}
declare module '*.tif' {
  const path: string
  export = path
}

// Audio
declare module '*.mp3' {
  const path: string
  export = path
}
declare module '*.wav' {
  const path: string
  export = path
}
declare module '*.ogg' {
  const path: string
  export = path
}
declare module '*.oga' {
  const path: string
  export = path
}
declare module '*.aac' {
  const path: string
  export = path
}
declare module '*.flac' {
  const path: string
  export = path
}

// Video
declare module '*.webm' {
  const path: string
  export = path
}
declare module '*.mp4' {
  const path: string
  export = path
}
declare module '*.m4v' {
  const path: string
  export = path
}
declare module '*.ogv' {
  const path: string
  export = path
}
declare module '*.mov' {
  const path: string
  export = path
}
declare module '*.avi' {
  const path: string
  export = path
}
