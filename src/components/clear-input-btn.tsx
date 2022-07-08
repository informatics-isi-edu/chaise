import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

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
      <ChaiseTooltip
        placement='bottom'
        tooltip='Clear input'
      >
        <span
          className={'remove-input-btn fa-solid fa-xmark ' + btnClassName}
          {... (clickCallback && { onClick: () => clickCallback() })}
        ></span>
      </ChaiseTooltip>
    </div>
  )
}
