import { baseResourceProps } from "./resource"

export interface EImageProps extends baseResourceProps {
  width: number
  height: number
}

export const EImage = (props: EImageProps) => {
  return <div className="elementer-image">
    {
      props.src
        ?
        <img src={props.src} alt={props.title} width={props.width} height={props.height} />
        :
        <div className="elementer-image__placeholder" style={{ width: '100%', height: '100%' }}>
          <span>No image</span>
        </div>
    }
  </div>
}
