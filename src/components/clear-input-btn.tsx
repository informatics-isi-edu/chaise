import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

type ClearInputBtnProps = {
  /**
   * the class name attached to the button.
   */
  btnClassName?: string,
  /**
   * the function that is called when users click on the button
   */
  clickCallback: Function,
  /**
   * the boolean condition to show it or not
   */
  show: boolean,
  /**
   * the customized tooltip for the button
   */
  tooltip?: string,
}

const ClearInputBtn = ({
  btnClassName,
  clickCallback,
  show,
  tooltip
}: ClearInputBtnProps) => {
  if (!show) {
    return <></>
  }

  tooltip = tooltip ? tooltip : 'Clear the input.';
  return (
    <div className='chaise-input-control-feedback'>
      <ChaiseTooltip
        placement='bottom'
        tooltip={tooltip}
      >
        <span
          className={'remove-input-btn fa-solid fa-xmark ' + btnClassName}
          {... (clickCallback && { onClick: (e: any) => clickCallback(e) })}
        ></span>
      </ChaiseTooltip>
    </div>
  )
}

export default ClearInputBtn;
