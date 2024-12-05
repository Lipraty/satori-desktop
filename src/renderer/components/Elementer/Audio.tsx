import { baseResourceProps } from "./resource"

export interface EAudioProps extends baseResourceProps {
  duration?: number
  poster?: string
}

export const EAudio = (props: EAudioProps) => {
  return <audio src={props.src} controls />
}
