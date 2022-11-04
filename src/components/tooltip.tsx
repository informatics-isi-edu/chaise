import { Placement } from 'react-bootstrap/types';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

type ChaiseTooltipProps = {
  /**
   * The displayed tooltip.
   */
  tooltip: string | JSX.Element,
  /**
   * where the tooltip should be
   */
  placement: Placement,
  /**
   * The inner element
   */
  children: JSX.Element,
  /**
   * The class name that will be attached to the tooltip
   * (can be used for applying custom styles to the tooltip)
   */
   className?: string,
   show?: boolean,
   onToggle?: (nextShow: boolean) => void
}


const ChaiseTooltip = ({
  tooltip,
  children,
  placement,
  className,
  show,
  onToggle
}: ChaiseTooltipProps): JSX.Element => {
  return (
    <OverlayTrigger
      show={show}
      onToggle={onToggle}
      placement={placement}
      overlay={
        <Tooltip className={className}>
          {tooltip}
        </Tooltip>
      }
    >
      {children}
    </OverlayTrigger>
  )
};

export default ChaiseTooltip;
