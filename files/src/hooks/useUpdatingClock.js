import {useEffect, useState} from 'react'

export default function useUpdatingClock() {
  // An example of using React hooks to maintain local state.
  const [date, setDate] = useState(() => new Date())

  // Data we need for our updated time in the UI.
  const hours = date.getHours()
  const hour = hours % 12 || 12
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  const amPm = hours >= 12 ? 'pm' : 'am'

  // An example of using `useEffect` to update the DOM with the latest time.
  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date())
    }, 251)

    // This "clean up" function will run when the consuming component unmounts.
    return () => {
      clearInterval(interval)
    }
  }, [])

  return {hour, minutes, seconds, amPm}
}
