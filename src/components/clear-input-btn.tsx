import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

type ClearInputBtnProps = {
  btnClassName?: string,
  clickCallback: Function,
  show: boolean
}

export const ClearInputBtn = ({
  btnClassName,
  clickCallback,
  show
}: ClearInputBtnProps) => {
  if (!show) {
    return <></>
  }

  return (
    <div className='chaise-input-control-feedback'>
      <OverlayTrigger placement='bottom' overlay={
        <Tooltip>Clear input</Tooltip>
      }
      >
        <span
          className={'remove-input-btn fa-solid fa-xmark ' + btnClassName}
          {... (clickCallback && { onClick: () => clickCallback() })}
        ></span>
      </OverlayTrigger>

    </div>
  )
}
